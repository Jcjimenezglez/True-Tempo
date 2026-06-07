const {
  isLegacyComplimentaryMember,
  isPayingPremiumMember,
  isLeaderboardEligible,
  getLeaderboardMemberType,
} = require('../api/lib/leaderboard-eligibility');

describe('leaderboard-eligibility', () => {
  it('includes migration complimentary users with focus time', () => {
    const meta = {
      isPremium: true,
      paymentType: 'complimentary',
      legacyFreeGrant: true,
    };

    expect(isLegacyComplimentaryMember(meta)).toBe(true);
    expect(isPayingPremiumMember(meta)).toBe(false);
    expect(isLeaderboardEligible(meta, 2)).toBe(true);
    expect(getLeaderboardMemberType(meta)).toBe('legacy_complimentary');
  });

  it('includes paying premium users with focus time', () => {
    const meta = {
      isPremium: true,
      paymentType: 'monthly',
    };

    expect(isPayingPremiumMember(meta)).toBe(true);
    expect(isLeaderboardEligible(meta, 1.5)).toBe(true);
    expect(getLeaderboardMemberType(meta)).toBe('paying_premium');
  });

  it('excludes active free users without premium or legacy grant', () => {
    const meta = { isPremium: false };

    expect(isLeaderboardEligible(meta, 10)).toBe(false);
    expect(getLeaderboardMemberType(meta)).toBeNull();
  });

  it('excludes complimentary premium without legacy grant', () => {
    const meta = {
      isPremium: true,
      paymentType: 'complimentary',
    };

    expect(isLeaderboardEligible(meta, 5)).toBe(false);
  });

  it('excludes users below the minimum focus threshold', () => {
    const meta = {
      isPremium: true,
      paymentType: 'monthly',
    };

    expect(isLeaderboardEligible(meta, 0)).toBe(false);
    expect(isLeaderboardEligible(meta, 0.001)).toBe(false);
  });
});
