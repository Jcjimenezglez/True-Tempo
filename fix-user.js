// Quick fix script for omrvieito@gmail.com
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function fixUser() {
  try {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Find user omrvieito@gmail.com
    const users = await clerk.users.getUserList({ limit: 100 });
    const targetUser = users.data.find(user => 
      user.emailAddresses?.some(email => email.emailAddress === 'omrvieito@gmail.com')
    );

    if (!targetUser) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', targetUser.id);

    // Update metadata
    await clerk.users.updateUserMetadata(targetUser.id, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        isPremium: true,
        premiumSince: new Date().toISOString(),
        // Add the Stripe customer ID once you find it
        stripeCustomerId: 'REPLACE_WITH_ACTUAL_CUSTOMER_ID'
      }
    });

    console.log('User updated successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUser();
