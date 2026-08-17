const mockSessionsCreate = jest.fn();
const mockGetUser = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionsCreate
      }
    }
  }));
});

jest.mock('@clerk/clerk-sdk-node', () => ({
  createClerkClient: jest.fn(() => ({
    users: {
      getUser: mockGetUser
    }
  }))
}));

describe('create-checkout-session', () => {
  const originalEnv = process.env;

  function loadHandler() {
    let handler;
    jest.isolateModules(() => {
      handler = require('../api/create-checkout-session');
    });
    return handler;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: 'sk_test_1234567890',
      STRIPE_PRICE_ID_PREMIUM: 'price_1234567890',
      CLERK_SECRET_KEY: 'clerk_test_secret',
      NODE_ENV: 'test'
    };
    mockSessionsCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123'
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates a paid monthly checkout without a default trial', async () => {
    mockGetUser.mockResolvedValue({
      publicMetadata: {}
    });

    const handler = loadHandler();
    const req = {
      method: 'POST',
      headers: { 'x-clerk-userid': 'user_123' },
      body: { planType: 'monthly', userId: 'user_123', userEmail: 'user@example.com' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await handler(req, res);

    expect(mockSessionsCreate).toHaveBeenCalledTimes(1);
    const sessionConfig = mockSessionsCreate.mock.calls[0][0];
    expect(sessionConfig.mode).toBe('subscription');
    expect(sessionConfig.subscription_data).toBeUndefined();
    expect(sessionConfig.metadata.trial_days).toBe('0');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      trialDays: 0
    }));
  });

  it('keeps a 90-day trial only for eligible referral users', async () => {
    mockGetUser.mockResolvedValue({
      publicMetadata: {
        referralExtendedTrialEligible: true
      }
    });

    const handler = loadHandler();
    const req = {
      method: 'POST',
      headers: {},
      body: { planType: 'monthly', userId: 'user_ref' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await handler(req, res);

    const sessionConfig = mockSessionsCreate.mock.calls[0][0];
    expect(sessionConfig.subscription_data).toEqual({ trial_period_days: 90 });
    expect(sessionConfig.metadata.trial_days).toBe('90');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      trialDays: 90,
      referralExtendedTrialApplied: true
    }));
  });
});
