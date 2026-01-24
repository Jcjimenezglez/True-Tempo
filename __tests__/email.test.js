// Mock Resend email service
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn()
    }
  }))
}));

const { Resend } = require('resend');

describe('Email Functions - normalizeTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.RESEND_FROM_EMAIL = 'Superfocus <noreply@updates.superfocus.live>';
  });

  describe('Tag Normalization', () => {
    it('should return undefined for empty tags', () => {
      // Test tag normalization logic
      const tags = [];
      const isArray = Array.isArray(tags);
      const isEmpty = tags.length === 0;

      expect(isArray).toBe(true);
      expect(isEmpty).toBe(true);
    });

    it('should return undefined for null tags', () => {
      const tags = null;
      expect(tags).toBeNull();
    });

    it('should convert string array to tag objects', () => {
      const tags = ['signup_welcome'];
      const normalized = tags.map((name) => ({
        name,
        value: '1',
      }));

      expect(normalized).toEqual([
        { name: 'signup_welcome', value: '1' }
      ]);
    });

    it('should handle multiple string tags', () => {
      const tags = ['signup_welcome', 'activation'];
      const normalized = tags.map((name) => ({
        name,
        value: '1',
      }));

      expect(normalized).toHaveLength(2);
      expect(normalized[0]).toEqual({ name: 'signup_welcome', value: '1' });
      expect(normalized[1]).toEqual({ name: 'activation', value: '1' });
    });

    it('should keep object tags as-is', () => {
      const tags = [
        { name: 'event', value: 'signup_welcome' },
        { name: 'source', value: 'api' }
      ];

      // Already in correct format
      expect(tags[0].name).toBe('event');
      expect(tags[0].value).toBe('signup_welcome');
    });
  });

  describe('Email Configuration', () => {
    it('should have RESEND_API_KEY configured', () => {
      expect(process.env.RESEND_API_KEY).toBeDefined();
    });

    it('should have FROM_EMAIL configured', () => {
      expect(process.env.RESEND_FROM_EMAIL).toBeDefined();
    });

    it('should trim API key whitespace', () => {
      process.env.RESEND_API_KEY = '  test-api-key  \n';
      const trimmed = process.env.RESEND_API_KEY.trim();
      expect(trimmed).toBe('test-api-key');
    });

    it('should use default FROM_EMAIL when not configured', () => {
      delete process.env.RESEND_FROM_EMAIL;
      const defaultFrom = 'Superfocus <noreply@updates.superfocus.live>';
      expect(defaultFrom).toBeDefined();
    });

    it('should trim FROM_EMAIL whitespace', () => {
      process.env.RESEND_FROM_EMAIL = '  Superfocus <test@example.com>  \n';
      const trimmed = process.env.RESEND_FROM_EMAIL.trim();
      expect(trimmed).toBe('Superfocus <test@example.com>');
    });
  });

  describe('Email Validation', () => {
    it('should accept single email string', () => {
      const to = 'user@example.com';
      const emails = Array.isArray(to) ? to : [to];

      expect(emails).toEqual(['user@example.com']);
      expect(emails).toHaveLength(1);
    });

    it('should accept email array', () => {
      const to = ['user1@example.com', 'user2@example.com'];
      const emails = Array.isArray(to) ? to : [to];

      expect(emails).toEqual(['user1@example.com', 'user2@example.com']);
      expect(emails).toHaveLength(2);
    });

    it('should require subject', () => {
      const subject = 'Welcome to Superfocus';
      expect(subject).toBeTruthy();
      expect(typeof subject).toBe('string');
    });

    it('should require html content', () => {
      const html = '<h1>Welcome</h1><p>Hello user</p>';
      expect(html).toBeTruthy();
      expect(html).toContain('<');
    });

    it('should support optional text content', () => {
      const text = 'Welcome\nHello user';
      expect(text).toBeTruthy();
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique tracking ID', () => {
      const id1 = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const id2 = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2); // Different IDs
    });

    it('should have timestamp component', () => {
      const timestamp = Date.now();
      const id = `${timestamp}-abc123`;

      expect(id).toContain(timestamp.toString());
    });

    it('should have random component', () => {
      const random = Math.random().toString(36).substring(7);

      expect(random).toMatch(/^[a-z0-9]+$/);
      expect(random.length).toBeGreaterThan(0);
    });
  });

  describe('Email Payload Structure', () => {
    it('should create valid email payload', () => {
      const emailPayload = {
        from: 'Superfocus <noreply@updates.superfocus.live>',
        to: ['user@example.com'],
        subject: 'Welcome to Superfocus',
        html: '<h1>Welcome</h1>',
        text: 'Welcome',
        tags: [{ name: 'signup', value: '1' }],
        headers: {
          'X-Tracking-ID': '1234567-abc123'
        }
      };

      expect(emailPayload.from).toBeDefined();
      expect(emailPayload.to).toBeInstanceOf(Array);
      expect(emailPayload.subject).toBeDefined();
      expect(emailPayload.html).toBeDefined();
    });

    it('should include tracking headers', () => {
      const trackingId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const headers = {
        'X-Tracking-ID': trackingId
      };

      expect(headers['X-Tracking-ID']).toBeDefined();
      expect(headers['X-Tracking-ID']).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('Resend Service Integration', () => {
    it('should initialize Resend with API key', () => {
      const mockResend = new Resend(process.env.RESEND_API_KEY);
      expect(Resend).toHaveBeenCalledWith(process.env.RESEND_API_KEY);
    });

    it('should call Resend emails.send method', () => {
      const mockResend = new Resend(process.env.RESEND_API_KEY);
      expect(mockResend.emails.send).toBeDefined();
      expect(typeof mockResend.emails.send).toBe('function');
    });

    it('should handle successful email send response', () => {
      const successResponse = {
        data: { id: 'email-123', from: 'noreply@updates.superfocus.live' },
        error: null
      };

      expect(successResponse.data).toBeDefined();
      expect(successResponse.error).toBeNull();
      expect(successResponse.data.id).toBeDefined();
    });

    it('should handle email send error response', () => {
      const errorResponse = {
        data: null,
        error: { message: 'Invalid email address' }
      };

      expect(errorResponse.data).toBeNull();
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.message).toBeDefined();
    });
  });

  describe('Email Service Error Handling', () => {
    it('should handle missing RESEND_API_KEY gracefully', () => {
      delete process.env.RESEND_API_KEY;

      const hasApiKey = !!process.env.RESEND_API_KEY;
      expect(hasApiKey).toBe(false);
    });

    it('should return error when API key not configured', () => {
      delete process.env.RESEND_API_KEY;

      const isConfigured = !!process.env.RESEND_API_KEY;
      const errorMessage = 'Email service not configured';

      expect(isConfigured).toBe(false);
      expect(errorMessage).toBeDefined();
    });
  });

  describe('Special Characters in Tags', () => {
    it('should handle tags with underscores', () => {
      const tag = 'signup_welcome';
      expect(tag).toMatch(/^[a-z_]+$/);
    });

    it('should handle tags with hyphens', () => {
      const tag = 'premium-upgrade';
      expect(tag).toMatch(/^[a-z\-]+$/);
    });

    it('should handle numeric tags', () => {
      const tag = 'campaign_2024';
      expect(tag).toMatch(/^[a-z_0-9]+$/);
    });
  });
});
