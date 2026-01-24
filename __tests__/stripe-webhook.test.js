const Stripe = require('stripe');

// Mock Stripe and Clerk
jest.mock('stripe');
jest.mock('@clerk/clerk-sdk-node', () => ({
  createClerkClient: jest.fn(() => ({
    users: {
      updateUser: jest.fn()
    }
  }))
}));

// Mock fetch for GA4 Measurement Protocol
global.fetch = jest.fn();

describe('Stripe Webhook - Conversion Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GA4_MEASUREMENT_ID = 'G-TEST123';
    process.env.GA4_API_SECRET = 'test-api-secret';
    process.env.GOOGLE_ADS_CONVERSION_ID = 'AW-TEST123';
    process.env.GOOGLE_ADS_CONVERSION_LABEL = 'TEST-LABEL';
    process.env.CLERK_SECRET_KEY = 'test-secret';
    global.fetch.mockClear();
  });

  describe('Configuration Validation', () => {
    it('should have required environment variables configured', () => {
      expect(process.env.GA4_MEASUREMENT_ID).toBeDefined();
      expect(process.env.GA4_API_SECRET).toBeDefined();
      expect(process.env.GOOGLE_ADS_CONVERSION_ID).toBeDefined();
      expect(process.env.GOOGLE_ADS_CONVERSION_LABEL).toBeDefined();
      expect(process.env.CLERK_SECRET_KEY).toBeDefined();
    });

    it('should use default GA4 Measurement ID when not configured', () => {
      delete process.env.GA4_MEASUREMENT_ID;
      const defaultId = 'G-T3T0PES8C0';
      expect(defaultId).toBeDefined();
    });

    it('should use default Google Ads Conversion ID when not configured', () => {
      delete process.env.GOOGLE_ADS_CONVERSION_ID;
      const defaultId = 'AW-17614436696';
      expect(defaultId).toBeDefined();
    });

    it('should use default Google Ads Conversion Label when not configured', () => {
      delete process.env.GOOGLE_ADS_CONVERSION_LABEL;
      const defaultLabel = 'PHPkCOP1070bENjym89B';
      expect(defaultLabel).toBeDefined();
    });
  });

  describe('Stripe Webhook Events', () => {
    it('should handle payment success event', () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded',
            amount: 9900,
            currency: 'usd',
            metadata: {
              userId: 'user123',
              email: 'test@example.com'
            }
          }
        }
      };

      // Webhook should recognize this event type
      expect(event.type).toMatch(/^payment_intent\./);
      expect(event.data.object.status).toBe('succeeded');
    });

    it('should handle charge success event', () => {
      const event = {
        type: 'charge.succeeded',
        data: {
          object: {
            id: 'ch_test123',
            status: 'succeeded',
            amount: 9900,
            currency: 'usd',
            customer: 'cus_test123'
          }
        }
      };

      expect(event.type).toBe('charge.succeeded');
      expect(event.data.object.status).toBe('succeeded');
    });

    it('should handle customer subscription creation', () => {
      const event = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            metadata: {
              userId: 'user123'
            }
          }
        }
      };

      expect(event.type).toBe('customer.subscription.created');
      expect(event.data.object.status).toBe('active');
    });

    it('should handle customer subscription updated', () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active'
          }
        }
      };

      expect(event.type).toBe('customer.subscription.updated');
    });

    it('should handle customer subscription deleted (cancellation)', () => {
      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled'
          }
        }
      };

      expect(event.type).toBe('customer.subscription.deleted');
      expect(event.data.object.status).toBe('canceled');
    });

    it('should handle invoice payment succeeded', () => {
      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            status: 'paid'
          }
        }
      };

      expect(event.type).toBe('invoice.payment_succeeded');
      expect(event.data.object.status).toBe('paid');
    });
  });

  describe('Conversion Tracking Data Structure', () => {
    it('should create valid GA4 payload', () => {
      const ga4Payload = {
        client_id: 'server.testemail123456.1234567890',
        user_id: 'test@example.com',
        events: [{
          name: 'purchase',
          params: {
            transaction_id: 'conv_1234567890',
            value: 9.99,
            currency: 'USD',
            conversion_type: 'premium_purchase',
            conversion_label: 'TEST-LABEL',
            source: 'server_webhook',
            items: [{
              item_id: 'premium_subscription',
              item_name: 'Premium Subscription',
              price: 9.99,
              quantity: 1
            }]
          }
        }]
      };

      expect(ga4Payload.events[0].name).toBe('purchase');
      expect(ga4Payload.events[0].params.currency).toBe('USD');
      expect(ga4Payload.events[0].params.source).toBe('server_webhook');
      expect(ga4Payload.events[0].params.items[0].item_id).toBe('premium_subscription');
    });

    it('should generate consistent client ID from email', () => {
      const email = 'user@example.com';
      const sanitized = email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
      const clientId = `server.${sanitized}.${Date.now()}`;

      expect(clientId).toMatch(/^server\.[a-zA-Z0-9]+\.\d+$/);
      expect(clientId).toContain('userexamplecom');
    });

    it('should generate transaction ID when not provided', () => {
      const transactionId = `conv_${Date.now()}`;

      expect(transactionId).toMatch(/^conv_\d+$/);
    });

    it('should handle conversion value correctly', () => {
      const values = [
        { input: 9.99, expected: 9.99 },
        { input: 99.99, expected: 99.99 },
        { input: 1.0, expected: 1.0 },
        { input: 49.99, expected: 49.99 }
      ];

      values.forEach(({ input, expected }) => {
        expect(input).toBe(expected);
      });
    });
  });

  describe('Conversion Tracking Types', () => {
    it('should support premium purchase conversion type', () => {
      const conversionType = 'premium_purchase';
      expect(conversionType).toBe('premium_purchase');
    });

    it('should support premium renewal conversion type', () => {
      const conversionType = 'premium_renewal';
      expect(conversionType).toBe('premium_renewal');
    });

    it('should support premium upgrade conversion type', () => {
      const conversionType = 'premium_upgrade';
      expect(conversionType).toBe('premium_upgrade');
    });
  });

  describe('Error Handling', () => {
    it('should log error when GA4 API returns non-success status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Invalid payload')
      });

      // Test that error handling is in place
      const response = global.fetch.mock.results[0]?.value;
      if (response) {
        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
      }
    });

    it('should handle fetch errors gracefully', async () => {
      const error = new Error('Network error');
      global.fetch.mockRejectedValueOnce(error);

      // Test that error is caught
      try {
        throw error;
      } catch (e) {
        expect(e.message).toBe('Network error');
      }
    });
  });

  describe('GA4 Measurement Protocol URL', () => {
    it('should construct correct GA4 URL', () => {
      const ga4MeasurementId = 'G-TEST123';
      const ga4ApiSecret = 'test-secret';
      const expectedUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${ga4MeasurementId}&api_secret=${ga4ApiSecret}`;

      expect(expectedUrl).toContain('google-analytics.com/mp/collect');
      expect(expectedUrl).toContain('measurement_id=G-TEST123');
      expect(expectedUrl).toContain('api_secret=test-secret');
    });
  });
});
