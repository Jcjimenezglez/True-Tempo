// Admin API - Downgrade user to Free
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Update user metadata in Clerk to mark as Free
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                public_metadata: {
                    isPremium: false,
                    downgradedAt: new Date().toISOString(),
                    downgradedBy: 'admin'
                }
            })
        });

        if (!clerkResponse.ok) {
            throw new Error('Failed to downgrade user in Clerk');
        }

        // Log the downgrade action
        console.log(`User ${userId} downgraded to Free by admin at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'User downgraded to Free successfully'
        });

    } catch (error) {
        console.error('Error downgrading user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
