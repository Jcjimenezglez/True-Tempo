// Admin API - Upgrade user to Pro
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Update user metadata in Clerk to mark as Premium
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                public_metadata: {
                    isPremium: true,
                    upgradedAt: new Date().toISOString(),
                    upgradedBy: 'admin'
                }
            })
        });

        if (!clerkResponse.ok) {
            throw new Error('Failed to upgrade user in Clerk');
        }

        // Log the upgrade action
        console.log(`User ${userId} upgraded to Pro by admin at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'User upgraded to Pro successfully'
        });

    } catch (error) {
        console.error('Error upgrading user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
