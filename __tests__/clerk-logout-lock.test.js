function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(String(key), String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    }
  };
}

describe('ClerkLogoutLock', () => {
  beforeEach(() => {
    jest.resetModules();
    global.window = global;
    global.localStorage = createMemoryStorage();
    global.sessionStorage = createMemoryStorage();
    require('../js/clerk-logout-lock.js');
  });

  it('keeps a fresh logout lock when Clerk has no user', () => {
    global.ClerkLogoutLock.set('sess_old');
    expect(global.ClerkLogoutLock.isLocked({ user: null, session: null })).toBe(true);
  });

  it('does not treat a new Clerk session as logged out after pricing login', () => {
    global.ClerkLogoutLock.set('sess_old');
    const clerk = {
      user: { id: 'user_1' },
      session: { id: 'sess_new' }
    };

    expect(global.ClerkLogoutLock.isLocked(clerk)).toBe(false);
    expect(global.localStorage.getItem('just_logged_out')).toBeNull();
  });

  it('still completes logout when the same session is still present', () => {
    global.ClerkLogoutLock.set('sess_old');
    const clerk = {
      user: { id: 'user_1' },
      session: { id: 'sess_old' }
    };

    expect(global.ClerkLogoutLock.isLocked(clerk)).toBe(true);
  });

  it('clears a stale lock if Clerk has a user but no stored session id', () => {
    global.localStorage.setItem('just_logged_out', 'true');
    global.sessionStorage.setItem('just_logged_out', 'true');
    const clerk = {
      user: { id: 'user_1' },
      session: { id: 'sess_live' }
    };

    expect(global.ClerkLogoutLock.isLocked(clerk)).toBe(false);
  });
});
