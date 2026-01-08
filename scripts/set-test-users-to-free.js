// Script to set test users to free using the API endpoint
// This script uses the /api/admin/change-user-status endpoint

const emails = [
  'julio93.314@gmail.com',
  'julio@front10.com'
];

async function findUserIds() {
  console.log('📋 Instructions to set users to FREE:\n');
  console.log('1. First, get the user IDs by visiting:');
  console.log('   https://www.superfocus.live/api/check-specific-user?email=julio93.314@gmail.com');
  console.log('   https://www.superfocus.live/api/check-specific-user?email=julio@front10.com\n');
  console.log('2. Then use the admin endpoint to set them to free:\n');
  
  for (const email of emails) {
    console.log(`For ${email}:`);
    console.log(`  curl -X POST https://www.superfocus.live/api/admin/change-user-status \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"userId": "USER_ID_HERE", "action": "remove"}'`);
    console.log('');
  }
  
  console.log('\nOr use the admin panel at: https://www.superfocus.live/admin-panel.html');
}

findUserIds();
























