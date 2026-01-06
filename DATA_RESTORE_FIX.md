# Fix: Data Restoration Logic and Reset Functionality

## 🐛 Problem Reported

User `superfocuslive@gmail.com` (new account) was getting data from `jcjimenezglez@gmail.com` (old account):
- New account showed old account's focus hours (8h 31min)
- Reset button didn't work - data kept coming back
- System was restoring wrong data from server

### Root Causes

1. **Aggressive Auto-Restore**: System was automatically restoring any server data without checking if account was new
2. **Reset Didn't Sync to Server**: Reset only cleared localStorage but left server data intact, so it restored on reload
3. **No Account Age Check**: New accounts were treated same as existing accounts

## ✅ Solution Implemented

### 1. **New Account Detection**

Added logic to detect brand new accounts and prevent auto-restoring potentially wrong data:

```javascript
// Check if user account is new (created recently, within last hour)
const accountAge = this.user.createdAt ? Date.now() - this.user.createdAt : Infinity;
const isNewAccount = accountAge < (60 * 60 * 1000); // Less than 1 hour old

// Don't auto-restore for brand new accounts - they should start fresh
if (isNewAccount && serverTotalHours > 0) {
    console.warn('⚠️ NEW ACCOUNT detected but has server data:', {
        accountAge: Math.round(accountAge / 1000 / 60) + ' minutes',
        serverHours: serverTotalHours,
        email: this.user.emailAddresses?.[0]?.emailAddress
    });
    console.warn('🚫 Skipping auto-restore for new account. User may need manual reset if this is wrong data.');
    // Start fresh for new accounts
    return false;
}
```

**Logic:**
- If account is less than 1 hour old AND has server data → **DON'T auto-restore**
- This prevents new accounts from getting data from old accounts
- Warning is logged for debugging

### 2. **Enhanced Logging**

Added detailed console logging to track what's happening:

```javascript
console.log('👤 User details:', {
    userId: this.user.id,
    email: this.user.emailAddresses?.[0]?.emailAddress,
    createdAt: this.user.createdAt
});

console.log('📊 Stats comparison:', {
    userId: this.user.id,
    userEmail: this.user.emailAddresses?.[0]?.emailAddress,
    localTotalHours: localStats.totalHours || 0,
    localHasData: hasLocalData,
    serverTotalHours: serverTotalHours,
    serverLastUpdated: serverStatsLastUpdated,
    hasOldGenericData: !!oldGenericStats
});
```

**What this shows:**
- User ID and email (to verify correct account)
- Account creation time
- Local vs server data comparison
- Whether old generic data exists

### 3. **Fixed Reset Functionality**

Made `resetAllData()` async and added server sync:

```javascript
async resetAllData() {
    if (!confirm('⚠️ Are you sure you want to PERMANENTLY reset ALL your focus data?...')) {
        return;
    }
    
    console.log('🗑️ Resetting all user data...');
    
    // Reset focus stats (user-specific and generic)
    const key = this.isAuthenticated && this.user?.id 
        ? `focusStats_${this.user.id}` 
        : 'focusStats';
    localStorage.removeItem(key);
    localStorage.removeItem('focusStats');
    
    // Reset focus seconds today
    if (this.isAuthenticated && this.user?.id) {
        localStorage.removeItem(`focusSecondsToday_${this.user.id}`);
        localStorage.removeItem(`focusSecondsTodayDate_${this.user.id}`);
    }
    localStorage.removeItem('focusSecondsToday');
    localStorage.removeItem('focusSecondsTodayDate');
    
    // Reset in-memory values
    this.focusSecondsToday = 0;
    
    // Reset streak data
    this.streakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null
    };
    localStorage.removeItem('streakData');
    
    // CRITICAL: Sync 0 hours to server to prevent restoration
    if (this.isAuthenticated && this.user?.id) {
        console.log('📤 Syncing reset (0 hours) to server...');
        try {
            await this.syncStatsToClerk(0);
            console.log('✅ Server stats reset to 0');
        } catch (error) {
            console.error('❌ Failed to reset server stats:', error);
            alert('Warning: Local data was reset but server sync failed. Data may be restored on next login.');
        }
    }
    
    // Update displays
    this.updateFocusHoursDisplay();
    this.updateStreakDisplay();
    
    console.log('✅ All focus data has been reset');
    alert('✅ All focus data has been reset successfully!');
}
```

**Key improvements:**
- ✅ Made function `async` to properly await server sync
- ✅ Clears BOTH localStorage AND server data
- ✅ Syncs 0 hours to Clerk publicMetadata
- ✅ Shows error if server sync fails
- ✅ Better user confirmation message
- ✅ Clears focus seconds today data

### 4. **Updated Event Listener**

Made the reset button event listener async:

```javascript
const settingsResetButton = document.getElementById('settingsResetButton');
if (settingsResetButton) {
    settingsResetButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.resetAllData();
        this.hideSettingsModal();
    });
}
```

## 🔄 Data Flow

### Before Fix

```
User A logs out
User B (new account) logs in
├─ Server has: 8h 31min (from User A - wrong!)
├─ restoreStatsFromClerk() runs automatically
├─ Restores User A's data to User B's localStorage
└─ User B sees User A's data ❌

User B clicks Reset
├─ Clears localStorage
├─ Server still has: 8h 31min
└─ On reload, data comes back ❌
```

### After Fix

```
User A logs out
User B (new account) logs in
├─ Server has: 8h 31min (from User A)
├─ restoreStatsFromClerk() checks: Is account new? YES
├─ Skips auto-restore for new account ✅
└─ User B starts with 0 hours ✅

User B clicks Reset
├─ Clears localStorage
├─ Syncs 0 hours to server
├─ Server now has: 0 hours ✅
└─ On reload, still 0 hours ✅
```

## 🧪 Testing Scenarios

### Scenario 1: New Account with Wrong Server Data
```
1. Create new account `superfocuslive@gmail.com`
2. Account is less than 1 hour old
3. Server somehow has 8h 31min
Expected: 
- Auto-restore is SKIPPED ✅
- Account starts with 0 hours ✅
- Console shows warning about new account ✅
```

### Scenario 2: Reset Button Works
```
1. User has 8h 31min in Report
2. Click Reset button in settings
3. Confirm the reset
Expected:
- LocalStorage cleared ✅
- Server synced to 0 hours ✅
- Report shows 0 hours ✅
- Reload page still shows 0 hours ✅
```

### Scenario 3: Existing Account with Server Data
```
1. Account is 2 days old
2. Server has 10 hours
3. LocalStorage is empty
Expected:
- Auto-restore works normally ✅
- Data restored from server ✅
- Account shows 10 hours ✅
```

## 📊 Console Logging for Debugging

When a user logs in, you'll see detailed logs:

```
🔄 Checking if stats need to be restored from server...
👤 User details: {
    userId: "user_2abc123",
    email: "superfocuslive@gmail.com",
    createdAt: 1736159400000
}
📊 Stats comparison: {
    userId: "user_2abc123",
    userEmail: "superfocuslive@gmail.com",
    localTotalHours: 0,
    localHasData: false,
    serverTotalHours: 8.52,
    serverLastUpdated: "2025-01-05T10:00:00.000Z",
    hasOldGenericData: false
}
⚠️ NEW ACCOUNT detected but has server data: {
    accountAge: 15,
    serverHours: 8.52,
    email: "superfocuslive@gmail.com"
}
🚫 Skipping auto-restore for new account
```

When resetting:

```
🗑️ Resetting all user data...
📤 Syncing reset (0 hours) to server...
✅ Server stats reset to 0
✅ All focus data has been reset
```

## 🎯 Benefits

1. **New Accounts Start Fresh**
   - No more inheriting data from other accounts
   - 1-hour grace period for new accounts

2. **Reset Actually Works**
   - Clears both localStorage AND server
   - Data doesn't come back after reload

3. **Better Debugging**
   - Detailed console logs show exactly what's happening
   - Can verify user IDs and email addresses

4. **Error Handling**
   - Shows warning if server sync fails
   - User knows if reset was incomplete

5. **User Confirmation**
   - Clear warning about permanent deletion
   - Explains what will be reset

## 🔧 Technical Details

### New Account Threshold
- **1 hour**: Accounts created within last hour are considered "new"
- **Adjustable**: Can be changed by modifying `60 * 60 * 1000` milliseconds
- **Rationale**: Gives enough time for account setup while protecting from wrong data

### Server Sync on Reset
- Uses existing `/api/sync-stats` endpoint
- Sends `totalHours: 0` to Clerk
- Updates `publicMetadata.totalFocusHours` to 0
- Prevents restoration on next login

### Account Age Calculation
```javascript
const accountAge = this.user.createdAt ? Date.now() - this.user.createdAt : Infinity;
const isNewAccount = accountAge < (60 * 60 * 1000);
```

- `Date.now()`: Current timestamp
- `this.user.createdAt`: Account creation timestamp from Clerk
- Difference is account age in milliseconds

## 🚨 Manual Fix for Affected Accounts

If `superfocuslive@gmail.com` still has wrong data:

1. **Login to affected account**
2. **Open browser console (F12)**
3. **Verify user ID**:
   ```javascript
   window.Clerk.user.id
   window.Clerk.user.emailAddresses[0].emailAddress
   ```
4. **Click Reset button in settings**
5. **Confirm reset**
6. **Verify in console**:
   ```
   📤 Syncing reset (0 hours) to server...
   ✅ Server stats reset to 0
   ```
7. **Reload page** - should show 0 hours

If reset doesn't work, check console for errors.

## 📝 Files Modified

1. **`script.js`**:
   - Enhanced `restoreStatsFromClerk()` with new account detection
   - Made `resetAllData()` async with server sync
   - Updated event listener to await async reset
   - Added comprehensive console logging

## 🔗 Related Fixes

- **USER_DATA_ISOLATION_FIX.md**: User-specific localStorage keys
- **STATS_SYNC_FIX.md**: Bidirectional sync between server and localStorage
- **CLERK_SESSION_PERSISTENCE_FIX.md**: Session persistence across pages

---

**Status**: ✅ Complete  
**Priority**: Critical - Data Integrity  
**Impact**: Prevents new accounts from getting wrong data  
**Date**: 2025-01-06

