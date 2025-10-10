// Script to activate Pro for a specific user
// Usage: node scripts/activate-user-pro.js

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function activateUserPro(email) {
    try {
        // First, find the user by email
        const searchResponse = await fetch('https://api.clerk.com/v1/users', {
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!searchResponse.ok) {
            throw new Error('Failed to search users');
        }

        const usersData = await searchResponse.json();
        const user = usersData.find(u => 
            u.email_addresses.some(emailObj => emailObj.email_address === email)
        );

        if (!user) {
            console.log(`User with email ${email} not found`);
            return;
        }

        console.log(`Found user: ${user.id} (${email})`);

        // Update user metadata to mark as Premium
        const updateResponse = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                public_metadata: {
                    isPremium: true,
                    upgradedAt: new Date().toISOString(),
                    upgradedBy: 'admin-script'
                }
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update user');
        }

        console.log(`✅ User ${email} has been upgraded to Pro!`);
        console.log(`User ID: ${user.id}`);
        console.log(`Upgraded at: ${new Date().toISOString()}`);

    } catch (error) {
        console.error('Error activating Pro:', error);
    }
}

// Activate Pro for the specific user
const userEmail = 'jcjimenezglez@gmail.com';
activateUserPro(userEmail);
