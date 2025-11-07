// Admin API - Get all users
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get all users from Clerk
        const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
            headers: {
                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!clerkResponse.ok) {
            throw new Error('Failed to fetch users from Clerk');
        }

        const clerkData = await clerkResponse.json();
        
        // Process users data
        const users = clerkData.map(user => ({
            id: user.id,
            email: user.email_addresses[0]?.email_address || 'No email',
            createdAt: user.created_at,
            isPremium: user.public_metadata?.isPremium === true
        }));

        // Calculate stats
        const stats = {
            total: users.length,
            pro: users.filter(user => user.isPremium).length,
            free: users.filter(user => !user.isPremium).length,
            conversionRate: users.length > 0 ? Math.round((users.filter(user => user.isPremium).length / users.length) * 100) : 0
        };

        res.status(200).json({
            users,
            stats
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}