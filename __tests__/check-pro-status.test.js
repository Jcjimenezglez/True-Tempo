const { checkProStatus } = require('../api/_check-pro-status');

// Mock Clerk
let mockGetUser = jest.fn();
jest.mock('@clerk/clerk-sdk-node', () => ({
  createClerkClient: jest.fn(() => ({
    users: {
      getUser: mockGetUser
    }
  }))
}));

describe('checkProStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockClear();
    process.env.CLERK_SECRET_KEY = 'test-secret-key';
  });

  describe('Developer Mode', () => {
    it('should grant Pro access when devMode=pro', async () => {
      const req = {
        url: 'https://example.com/api?devMode=pro',
        headers: { host: 'example.com' },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result).toEqual({
        isPro: true,
        userId: 'dev-mode-user',
        email: 'developer@mode.local',
        devMode: true
      });
    });

    it('should grant Pro access when bypass=true in query params', async () => {
      const req = {
        url: 'https://example.com/api',
        headers: { host: 'example.com' },
        query: { bypass: 'true' }
      };

      const result = await checkProStatus(req);

      // When bypass is in req.query, it should be recognized
      expect(result.isPro).toBe(true);
    });
  });

  describe('Clerk Authentication', () => {
    it('should check Pro status from Clerk metadata', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user123',
        publicMetadata: { isPremium: true },
        emailAddresses: [{ emailAddress: 'user@example.com' }],
        primaryEmailAddress: { emailAddress: 'user@example.com' }
      });

      const req = {
        url: 'https://example.com/api',
        headers: {
          host: 'example.com',
          'x-clerk-userid': 'user123'
        },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.isPro).toBe(true);
      expect(result.userId).toBe('user123');
      expect(result.email).toBe('user@example.com');
      expect(mockGetUser).toHaveBeenCalledWith('user123');
    });

    it('should return isPro false for free users', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user456',
        publicMetadata: { isPremium: false },
        emailAddresses: [{ emailAddress: 'free@example.com' }],
        primaryEmailAddress: { emailAddress: 'free@example.com' }
      });

      const req = {
        url: 'https://example.com/api',
        headers: {
          host: 'example.com',
          'x-clerk-userid': 'user456'
        },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.isPro).toBe(false);
      expect(result.userId).toBe('user456');
      expect(mockGetUser).toHaveBeenCalledWith('user456');
    });

    it('should get user ID from URL query parameter uid', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user789',
        publicMetadata: { isPremium: true },
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        primaryEmailAddress: { emailAddress: 'test@example.com' }
      });

      const req = {
        url: 'https://example.com/api?uid=user789',
        headers: { host: 'example.com' },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.isPro).toBe(true);
      expect(mockGetUser).toHaveBeenCalledWith('user789');
    });

    it('should get user ID from req.query', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user999',
        publicMetadata: { isPremium: true },
        emailAddresses: [{ emailAddress: 'query@example.com' }],
        primaryEmailAddress: { emailAddress: 'query@example.com' }
      });

      const req = {
        url: 'https://example.com/api',
        headers: { host: 'example.com' },
        query: { uid: 'user999' }
      };

      const result = await checkProStatus(req);

      expect(result.isPro).toBe(true);
      expect(mockGetUser).toHaveBeenCalledWith('user999');
    });
  });

  describe('Error Handling', () => {
    it('should return error when Clerk secret is not configured', async () => {
      delete process.env.CLERK_SECRET_KEY;

      const req = {
        url: 'https://example.com/api',
        headers: { host: 'example.com' },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.isPro).toBe(false);
      expect(result.error).toBe('Clerk not configured');
    });

    it('should return error when no user ID is provided', async () => {
      process.env.CLERK_SECRET_KEY = 'test-key';

      const req = {
        url: 'https://example.com/api',
        headers: { host: 'example.com' },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.isPro).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('should handle Clerk API errors gracefully', async () => {
      mockGetUser.mockRejectedValue(new Error('Clerk API error'));

      const req = {
        url: 'https://example.com/api',
        headers: {
          host: 'example.com',
          'x-clerk-userid': 'user123'
        },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.isPro).toBe(false);
      expect(result.error).toBe('Failed to verify status');
    });
  });

  describe('Email Extraction', () => {
    it('should use primaryEmailAddress when available', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user123',
        publicMetadata: { isPremium: false },
        emailAddresses: [{ emailAddress: 'secondary@example.com' }],
        primaryEmailAddress: { emailAddress: 'primary@example.com' }
      });

      const req = {
        url: 'https://example.com/api',
        headers: {
          host: 'example.com',
          'x-clerk-userid': 'user123'
        },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.email).toBe('primary@example.com');
      expect(mockGetUser).toHaveBeenCalledWith('user123');
    });

    it('should fallback to first emailAddress when primaryEmailAddress is missing', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user123',
        publicMetadata: { isPremium: false },
        emailAddresses: [{ emailAddress: 'fallback@example.com' }],
        primaryEmailAddress: null
      });

      const req = {
        url: 'https://example.com/api',
        headers: {
          host: 'example.com',
          'x-clerk-userid': 'user123'
        },
        query: {}
      };

      const result = await checkProStatus(req);

      expect(result.email).toBe('fallback@example.com');
      expect(mockGetUser).toHaveBeenCalledWith('user123');
    });
  });
});
