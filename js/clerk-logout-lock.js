(function (root) {
  const FLAG = 'just_logged_out';
  const AT = 'just_logged_out_at';
  const SID = 'just_logged_out_session_id';

  function read(key) {
    try {
      return sessionStorage.getItem(key) || localStorage.getItem(key) || '';
    } catch (_) {
      return '';
    }
  }

  function write(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (_) {}
  }

  function remove(key) {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (_) {}
  }

  function clear() {
    remove(FLAG);
    remove(AT);
    remove(SID);
  }

  function set(sessionId) {
    const now = String(Date.now());
    const sid = sessionId || '';
    try {
      write(sessionStorage, FLAG, 'true');
      write(sessionStorage, AT, now);
      write(sessionStorage, SID, sid);
      write(localStorage, FLAG, 'true');
      write(localStorage, AT, now);
      write(localStorage, SID, sid);
    } catch (_) {}
  }

  function isLocked(clerk) {
    const flagged = read(FLAG) === 'true';
    if (!flagged) {
      return false;
    }

    const currentSid = clerk?.session?.id || '';
    const hasLiveSession = !!(clerk?.user || clerk?.session);
    if (hasLiveSession) {
      const lockedSid = read(SID);
      // A different (or unknown) live session means the user signed in again.
      if (!lockedSid || (currentSid && currentSid !== lockedSid)) {
        clear();
        return false;
      }
    }

    return true;
  }

  root.ClerkLogoutLock = { clear, set, isLocked };
})(typeof window !== 'undefined' ? window : globalThis);
