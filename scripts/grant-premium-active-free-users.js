/**
 * Grant complimentary Premium to free users active in the last N days (default: 60).
 *
 * Activity = max(statsLastUpdated, lastActiveAt, lastSignInAt).
 * Skips: already premium, lifetime, legacy grant, active/trialing Stripe subscription.
 *
 * Usage:
 *   node scripts/grant-premium-active-free-users.js
 *   node scripts/grant-premium-active-free-users.js --active-days=60
 *   node scripts/grant-premium-active-free-users.js --apply --confirm=GRANT_COMPLIMENTARY
 */

const fs = require('fs');
const path = require('path');
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');
const { pruneMetadataToBudget } = require('../api/lib/clerk-metadata-utils');
const {
  MS_PER_DAY,
  classifyGrantEligibility,
  buildComplimentaryMetadata,
} = require('./lib/grant-premium-eligibility');

function loadEnvFile(relativePath, override = false) {
  const envPath = path.join(__dirname, '..', relativePath);
  if (!fs.existsSync(envPath)) return false;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n$/g, '').trim();
    if (override || !process.env[key]) process.env[key] = value;
  }
  return true;
}

function isPlaceholderEnvValue(value) {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes('your_') ||
    v.includes('_here') ||
    v.includes('replace_with') ||
    v === 'sk_test_your_clerk_secret_key_here' ||
    v === 'sk_test_your_stripe_secret_key_here'
  );
}

function loadEnvFiles() {
  loadEnvFile('.env.vercel.tmp');
  const localPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(localPath)) return;

  const content = fs.readFileSync(localPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n$/g, '').trim();
    if (!isPlaceholderEnvValue(value)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const opts = {
    activeDays: 60,
    dryRun: true,
    apply: false,
    confirm: null,
    maxUsers: Infinity,
    outputDir: path.join(__dirname, 'output'),
  };

  for (const arg of argv) {
    if (arg === '--apply') {
      opts.apply = true;
      opts.dryRun = false;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
      opts.apply = false;
    } else if (arg.startsWith('--active-days=')) {
      const parsed = parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) opts.activeDays = parsed;
    } else if (arg.startsWith('--confirm=')) {
      opts.confirm = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--max-users=')) {
      opts.maxUsers = Math.max(1, parseInt(arg.split('=')[1], 10) || 1);
    }
  }

  return opts;
}

function getPrimaryEmail(user) {
  const primaryId = user.primaryEmailAddressId;
  const match = user.emailAddresses?.find((e) => e.id === primaryId);
  return match?.emailAddress || user.emailAddresses?.[0]?.emailAddress || null;
}

async function fetchAllUsers(clerk, maxUsers) {
  const users = [];
  let offset = 0;
  const pageSize = 100;

  while (users.length < maxUsers) {
    const limit = Math.min(pageSize, maxUsers - users.length);
    const response = await clerk.users.getUserList({ limit, offset });
    const page = Array.isArray(response?.data) ? response.data : [];
    if (!page.length) break;
    users.push(...page);
    offset += page.length;
    if (page.length < limit) break;
  }

  return users;
}

async function hasActiveStripeSubscription(stripe, customerId) {
  if (!stripe || !customerId) return false;
  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
    });
    return subs.data.some((s) => s.status === 'active' || s.status === 'trialing');
  } catch (err) {
    console.warn(`⚠️ Stripe check failed for ${customerId}: ${err.message}`);
    return true;
  }
}

async function main() {
  loadEnvFiles();
  const opts = parseArgs(process.argv.slice(2));

  const clerkKey = process.env.CLERK_SECRET_KEY;
  if (!clerkKey) {
    console.error('❌ CLERK_SECRET_KEY not set (.env.vercel.tmp or .env.local)');
    process.exit(1);
  }

  if (opts.apply && opts.confirm !== 'GRANT_COMPLIMENTARY') {
    console.error(
      '❌ Applying grants requires: --apply --confirm=GRANT_COMPLIMENTARY'
    );
    process.exit(1);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeKey ? new Stripe(stripeKey) : null;
  const clerk = createClerkClient({ secretKey: clerkKey });

  const activeSince = new Date(Date.now() - opts.activeDays * MS_PER_DAY);

  console.log('🔍 Grant complimentary Premium to active free users');
  console.log(`   Mode: ${opts.dryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log(`   Active since: ${activeSince.toISOString()} (${opts.activeDays} days)`);
  console.log('   Activity signals: statsLastUpdated → lastActiveAt → lastSignInAt\n');

  const allUsers = await fetchAllUsers(clerk, opts.maxUsers);
  console.log(`📊 Scanned ${allUsers.length} Clerk users\n`);

  const skipped = {};
  const toGrant = [];

  for (const user of allUsers) {
    const check = classifyGrantEligibility(user, activeSince);
    if (!check.eligible) {
      skipped[check.reason] = (skipped[check.reason] || 0) + 1;
      continue;
    }

    const customerId = user.publicMetadata?.stripeCustomerId;
    if (customerId && stripe) {
      const active = await hasActiveStripeSubscription(stripe, customerId);
      if (active) {
        skipped.stripe_still_active = (skipped.stripe_still_active || 0) + 1;
        continue;
      }
    }

    toGrant.push({
      id: user.id,
      email: getPrimaryEmail(user),
      createdAt: user.createdAt,
      lastActivityAt: check.lastActivityAt,
      totalFocusHours: user.publicMetadata?.totalFocusHours ?? null,
      hadStripe: !!customerId,
    });
  }

  fs.mkdirSync(opts.outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(opts.outputDir, `grant-complimentary-premium-${stamp}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        options: opts,
        activeSince: activeSince.toISOString(),
        scanned: allUsers.length,
        grantCount: toGrant.length,
        skipped,
        users: toGrant,
      },
      null,
      2
    )
  );

  console.log(`✅ Eligible for complimentary Premium: ${toGrant.length}`);
  console.log('   Skipped:', skipped);
  console.log(`📄 Full list: ${reportPath}\n`);

  if (toGrant.length > 0) {
    console.log(`   Sample (first ${Math.min(10, toGrant.length)}):`);
    toGrant.slice(0, 10).forEach((u) => {
      console.log(`   - ${u.email || u.id} | last: ${u.lastActivityAt}`);
    });
    console.log('');
  }

  if (opts.dryRun) {
    console.log('ℹ️  Dry run only. To apply:');
    console.log(
      '   node scripts/grant-premium-active-free-users.js --apply --confirm=GRANT_COMPLIMENTARY'
    );
    return;
  }

  const concurrency = 8;
  let granted = 0;
  let failed = 0;
  let index = 0;

  async function grantOne(entry) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const user = await clerk.users.getUser(entry.id);
        const nextMetadata = pruneMetadataToBudget(
          buildComplimentaryMetadata(user.publicMetadata || {})
        );
        await clerk.users.updateUser(entry.id, {
          publicMetadata: nextMetadata,
        });
        granted += 1;
        if (granted % 50 === 0) {
          console.log(`   …granted ${granted}/${toGrant.length}`);
        }
        return;
      } catch (err) {
        const retryAfter = err?.retryAfter;
        if (err?.status === 429 && attempt < 3) {
          const waitMs = (retryAfter ? retryAfter * 1000 : 1500) + attempt * 500;
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        failed += 1;
        console.error(`❌ ${entry.id}: ${err.message}`);
        return;
      }
    }
  }

  async function worker() {
    while (index < toGrant.length) {
      const entry = toGrant[index++];
      await grantOne(entry);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log(`\n✨ Done. Granted: ${granted}, failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
