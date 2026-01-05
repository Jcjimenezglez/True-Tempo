// Script to set test users to free using production API endpoints
const https = require('https');

const BASE_URL = 'https://www.superfocus.live';
const emails = [
  'julio93.314@gmail.com',
  'julio@front10.com'
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function getUserByEmail(email) {
  console.log(`\n🔍 Looking up user: ${email}`);
  try {
    const response = await makeRequest(`${BASE_URL}/api/check-specific-user?email=${encodeURIComponent(email)}`);
    
    if (response.status === 200 && response.data.userId) {
      console.log(`✅ Found user ID: ${response.data.userId}`);
      return response.data.userId;
    } else {
      console.error(`❌ User not found or error:`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error looking up user:`, error.message);
    return null;
  }
}

async function setUserToFree(userId) {
  console.log(`\n🔄 Setting user ${userId} to FREE...`);
  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/change-user-status`, {
      method: 'POST',
      body: {
        userId: userId,
        action: 'remove'
      }
    });

    if (response.status === 200 && response.data.success) {
      console.log(`✅ Successfully set user to FREE`);
      console.log(`   Updated isPremium: ${response.data.isPremium}`);
      return true;
    } else {
      console.error(`❌ Failed to set user to FREE:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error setting user to FREE:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting to set test users to FREE status...\n');
  console.log('Using production API endpoints...\n');

  for (const email of emails) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Processing: ${email}`);
    console.log('='.repeat(50));

    // Step 1: Get user ID
    const userId = await getUserByEmail(email);
    
    if (!userId) {
      console.log(`⏭️  Skipping ${email} - user ID not found`);
      continue;
    }

    // Step 2: Set user to free
    await setUserToFree(userId);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);























