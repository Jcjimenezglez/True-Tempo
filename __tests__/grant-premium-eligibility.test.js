const {
  parseDate,
  getLastProductActivity,
  classifyGrantEligibility,
  buildComplimentaryMetadata,
  MS_PER_DAY,
} = require('../scripts/lib/grant-premium-eligibility');

describe('grant-premium-eligibility', () => {
  const activeSince = new Date(Date.now() - 60 * MS_PER_DAY);

  it('parseDate returns null for invalid values', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
  });

  it('getLastProductActivity picks the latest signal', () => {
    const user = {
      lastSignInAt: Date.now() - 10 * MS_PER_DAY,
      lastActiveAt: Date.now() - 5 * MS_PER_DAY,
      publicMetadata: {
        statsLastUpdated: new Date(Date.now() - 2 * MS_PER_DAY).toISOString(),
      },
    };

    const last = getLastProductActivity(user);
    expect(last.getTime()).toBe(new Date(user.publicMetadata.statsLastUpdated).getTime());
  });

  it('classifyGrantEligibility grants active free users', () => {
    const user = {
      publicMetadata: {},
      lastSignInAt: Date.now() - 1 * MS_PER_DAY,
    };

    const result = classifyGrantEligibility(user, activeSince);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBe('active_free_user');
  });

  it('classifyGrantEligibility skips premium and lifetime users', () => {
    expect(
      classifyGrantEligibility({ publicMetadata: { isPremium: true } }, activeSince).reason
    ).toBe('already_premium');

    expect(
      classifyGrantEligibility({ publicMetadata: { isLifetime: true } }, activeSince).reason
    ).toBe('lifetime');
  });

  it('classifyGrantEligibility skips inactive free users', () => {
    const user = {
      publicMetadata: {},
      lastSignInAt: Date.now() - 90 * MS_PER_DAY,
    };

    const result = classifyGrantEligibility(user, activeSince);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('inactive');
  });

  it('buildComplimentaryMetadata preserves existing fields', () => {
    const metadata = buildComplimentaryMetadata({
      totalFocusHours: 12.5,
      statsLastUpdated: '2026-01-01T00:00:00.000Z',
    });

    expect(metadata.isPremium).toBe(true);
    expect(metadata.paymentType).toBe('complimentary');
    expect(metadata.legacyFreeGrant).toBe(true);
    expect(metadata.totalFocusHours).toBe(12.5);
    expect(metadata.statsLastUpdated).toBe('2026-01-01T00:00:00.000Z');
  });
});
