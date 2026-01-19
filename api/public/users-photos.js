// Public endpoint to get user photos for social proof section
// Returns a fixed list of 8 manually selected users

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Fixed list of 8 users manually selected
  // These are users authenticated with Google (they always have profile photos)
  const fixedUsers = [
    {
      id: 'user_1',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOFBJN2RUTjlIdUJyVmlTV0t0SUxaRDlBRlcifQ',
      firstName: 'User',
      lastName: '1',
      createdAt: new Date().toISOString(),
      emailAddress: 'user1@example.com'
    },
    {
      id: 'user_2',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOFA3eElIMUliVlV2V2lPN1JhREp1YU9mZW4ifQ',
      firstName: 'User',
      lastName: '2',
      createdAt: new Date().toISOString(),
      emailAddress: 'user2@example.com'
    },
    {
      id: 'user_3',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOFAwcWVxZTRZQWFPQnk2Nk5DbFJIV2hBU0cifQ',
      firstName: 'User',
      lastName: '3',
      createdAt: new Date().toISOString(),
      emailAddress: 'user3@example.com'
    },
    {
      id: 'user_4',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOExiQWV4NWhiSTBuOHl3Mlgwc2hBekVIZ2QifQ',
      firstName: 'User',
      lastName: '4',
      createdAt: new Date().toISOString(),
      emailAddress: 'user4@example.com'
    },
    {
      id: 'user_5',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOFRuR0tkdmpMOUdSOEFrM1JacnF0TmY3MnMifQ?width=96',
      firstName: 'User',
      lastName: '5',
      createdAt: new Date().toISOString(),
      emailAddress: 'user5@example.com'
    },
    {
      id: 'user_6',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOFJvUUpQdkVLd0xnQ1NIbFc3RzZJbnBnN2kifQ?width=96',
      firstName: 'User',
      lastName: '6',
      createdAt: new Date().toISOString(),
      emailAddress: 'user6@example.com'
    },
    {
      id: 'user_7',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOFJpaFRjZVJFaGI0amJmazI2cGtHZ3g1M3kifQ',
      firstName: 'User',
      lastName: '7',
      createdAt: new Date().toISOString(),
      emailAddress: 'user7@example.com'
    },
    {
      id: 'user_8',
      imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOFJqS1VlU0xoV1FEYXRGa0dPNFRLcFFpVGQifQ',
      firstName: 'User',
      lastName: '8',
      createdAt: new Date().toISOString(),
      emailAddress: 'user8@example.com'
    }
  ];

  res.status(200).json({
    success: true,
    users: fixedUsers,
    cached: false,
    lastUpdated: new Date().toISOString()
  });
};
