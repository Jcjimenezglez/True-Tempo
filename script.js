class PomodoroTimer {
    constructor() {
        // Initialize Mixpanel tracking removed - Page Loaded event no longer needed
        
        
        // Pomodoro Technique structure - Load from localStorage if authenticated
        const savedPomodoroTime = localStorage.getItem('pomodoroTime');
        const savedShortBreakTime = localStorage.getItem('shortBreakTime');
        const savedLongBreakTime = localStorage.getItem('longBreakTime');
        
        this.workTime = savedPomodoroTime ? parseInt(savedPomodoroTime) : 25 * 60; // 25 minutes default
        this.shortBreakTime = savedShortBreakTime ? parseInt(savedShortBreakTime) : 5 * 60; // 5 minutes default
        this.longBreakTime = savedLongBreakTime ? parseInt(savedLongBreakTime) : 15 * 60; // 15 minutes default
        this.sessionsPerCycle = 4; // 4 work sessions before long break
        
        // Current state
        this.timeLeft = this.workTime;
        this.isRunning = false;
        this.currentSection = 1; // 1-8 for complete cycle
        this.isWorkSession = true;
        this.isLongBreak = false;
        this.currentTaskName = null; // Current task being worked on
        this.sessionTasks = []; // Array to store tasks for each focus session
        this.interval = null;
        
        // Anti-cheat tracking within the current cycle
        this.completedFocusSessionsInCycle = 0; // counts naturally finished focus sessions
        this.cheatedDuringFocusInCycle = false; // true if user used next/back while in a focus session
        this.actualFocusTimeCompleted = 0; // tracks actual seconds of focus completed in current cycle
        this.requiredFocusTimeForCycle = 0; // total focus time required for a complete cycle

        // Day streak tracking
        this.streakData = this.loadStreakData();
        this.hasCompletedFocusToday = false; // tracks if user completed focus session today
        // Track focused seconds today for 1-minute streak rule
        try {
            const savedFocusDate = localStorage.getItem('focusSecondsTodayDate');
            const savedFocusSecs = parseInt(localStorage.getItem('focusSecondsToday') || '0', 10);
            const todayStr = new Date().toDateString();
            this.focusSecondsToday = savedFocusDate === todayStr ? Math.max(0, savedFocusSecs) : 0;
            if (savedFocusDate !== todayStr) {
                localStorage.setItem('focusSecondsTodayDate', todayStr);
                localStorage.setItem('focusSecondsToday', '0');
            }
        } catch (_) {
            this.focusSecondsToday = 0;
        }

        // Task execution queue (built from selected tasks and their session counts)
        this.taskQueue = [];
        this.currentTaskIndex = 0;
        this.currentTask = null;
        
        // Todoist integration (Pro feature)
        this.todoistToken = localStorage.getItem('todoistToken') || '';
        this.todoistTasks = [];
        this.todoistProjectsById = {};
        this.currentTask = null; // { id, content, project_id }
        
        
        // Notion integration (Pro feature)
        this.notionPages = [];
        
		// Lofi music system with shuffle
		this.lofiPlaying = false;
		const savedLofiEnabled = localStorage.getItem('lofiEnabled');
		this.lofiEnabled = savedLofiEnabled === null ? true : savedLofiEnabled === 'true';
		
		// Lofi playlist - will be dynamically loaded from /audio/Lofi/
		this.lofiPlaylist = [];
		this.lofiShuffledPlaylist = [];
		this.currentLofiTrackIndex = 0;
		
		// Load saved volume if exists, otherwise default to 25%
		const savedVolume = localStorage.getItem('lofiVolume');
		this.lofiVolume = savedVolume !== null ? Math.max(0, Math.min(1, parseFloat(savedVolume))) : 0.25;
		// Fade/ducking state
		this.isDucked = false;
		this.duckRestoreTimer = null;
		this.fadeTimer = null;
        
		// Immersive Theme System
		// Only load saved immersive theme if user is authenticated
		if (this.isAuthenticated) {
			this.currentImmersiveTheme = localStorage.getItem('selectedImmersiveTheme') || 'none';
		} else {
			this.currentImmersiveTheme = 'none'; // Always default for guests
		}
		this.tronImage = null;
		
		// Tron Spotify Widget Configuration
		this.tronSpotifyWidget = null;
		this.tronSpotifyPlaylistId = '47pjW3XDPW99NShtkeewxl'; // TRON: Ares Soundtrack by Nine Inch Nails
		this.tronSpotifyEmbedUrl = `https://open.spotify.com/embed/album/${this.tronSpotifyPlaylistId}`;
		this.tronSpotifyWidgetReady = false;
		this.spotifyLoadingElement = null;
		this.tronSpotifyWidgetActivated = false; // Track if widget has been activated
		
		// Note: We don't save Spotify connecting state - always show loading
		
		// Load last selected theme (for both authenticated and guest users)
		this.loadLastSelectedTheme();
        
        // Complete cycle: 25/5/25/5/25/5/25/15
        this.cycleSections = [
            { type: 'work', duration: this.workTime, name: 'Work 1' },
            { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
            { type: 'work', duration: this.workTime, name: 'Work 2' },
            { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
            { type: 'work', duration: this.workTime, name: 'Work 3' },
            { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
            { type: 'work', duration: this.workTime, name: 'Work 4' },
            { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
        ];
        
        // Calculate required focus time for complete cycle
        this.calculateRequiredFocusTime();
        
        // DOM elements
        this.timeElement = document.getElementById('time');
        this.sessionInfoElement = document.getElementById('sessionInfo');
        this.currentTaskElement = document.getElementById('currentTask');
        this.sessionLabelElement = document.getElementById('sessionLabel');
        this.startPauseBtn = document.getElementById('startPause');
        this.prevSectionBtn = document.getElementById('prevSectionBtn');
        this.nextSectionBtn = document.getElementById('nextSectionBtn');
        this.musicToggleBtn = document.getElementById('musicToggleBtn');
        this.taskToggleBtn = document.getElementById('taskToggleBtn');
        this.progressSegments = document.querySelectorAll('.progress-segment');
        this.progressIndicator = document.querySelector('.progress-indicator');
        this.progressOverlays = document.querySelectorAll('.progress-overlay');
        this.techniqueTitle = document.getElementById('techniqueTitle');
        this.techniqueDropdown = document.getElementById('techniqueDropdown');
        this.dropdownMenu = document.getElementById('dropdownMenu');
        this.dropdownItems = document.querySelectorAll('.dropdown-item');
        
        // Custom timer modal elements
        this.customTimerModal = document.getElementById('customTimerModal');
        this.closeCustomTimer = document.getElementById('closeCustomTimer');
        this.cancelCustomTimer = document.getElementById('cancelCustomTimer');
        this.saveCustomTimer = document.getElementById('saveCustomTimer');
        this.customPreview = document.getElementById('customPreview');
        this.backgroundAudio = document.getElementById('backgroundAudio');
        if (this.backgroundAudio) {
            this.backgroundAudio.addEventListener('ended', () => {
                // Advance to next Lofi track
                if (this.lofiPlaying || this.lofiEnabled) {
                    this.nextLofiTrack();
                }
            });
            // Defensive: when play() resolves, mark the correct flag
            this.backgroundAudio.addEventListener('play', () => {
                const src = this.backgroundAudio.currentSrc || this.backgroundAudio.src || '';
                const isLofi = /\/audio\/Lofi\//.test(src);
                this.lofiPlaying = isLofi;
            });
        }

		// Load Lofi playlist from /audio/Lofi/ directory
		this.loadLofiPlaylist();
        
        // Auth elements
        this.authContainer = document.getElementById('authContainer');
        this.loginButton = document.getElementById('loginButton');
        this.signupButton = document.getElementById('signupButton');
        
        // Settings dropdown elements
        this.headerSettingsBtn = document.getElementById('headerSettingsBtn');
        this.headerSettingsIcon = document.getElementById('headerSettingsIcon');
        this.headerSettingsAvatar = document.getElementById('headerSettingsAvatar');
        this.settingsDropdown = document.getElementById('settingsDropdown');
        this.settingsUserInfo = document.getElementById('settingsUserInfo');
        this.settingsUserEmail = document.getElementById('settingsUserEmail');
        this.settingsProBadge = document.getElementById('settingsProBadge');
        this.settingsAuthSection = document.getElementById('settingsAuthSection');
        this.settingsAccountSection = document.getElementById('settingsAccountSection');
        this.settingsReportSection = document.getElementById('settingsReportSection');
        this.settingsSettingsSection = document.getElementById('settingsSettingsSection');
        this.settingsLoginBtn = document.getElementById('settingsLoginBtn');
        this.settingsSignupBtn = document.getElementById('settingsSignupBtn');
        this.settingsUpgradeToProBtn = document.getElementById('settingsUpgradeToProBtn');
        this.settingsManageSubscriptionBtn = document.getElementById('settingsManageSubscriptionBtn');
        this.settingsAccountBtn = document.getElementById('settingsAccountBtn');
        this.settingsIntegrationsBtn = document.getElementById('settingsIntegrationsBtn');
        this.settingsFeedbackBtn = document.getElementById('settingsFeedbackBtn');
        this.settingsStatsDivider = document.getElementById('settingsStatsDivider');
        this.settingsUserDivider = document.getElementById('settingsUserDivider');
        this.shortcutsItem = document.getElementById('shortcutsItem');
        this.helpToggle = document.getElementById('helpToggle');
        this.helpPanel = document.getElementById('helpPanel');
        this.settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
        this.settingsLogoutDivider = document.getElementById('settingsLogoutDivider');
        
        // Logo and achievement elements
        this.logoIcon = document.getElementById('logoIcon');
        this.achievementIcon = document.getElementById('achievementIcon');
        this.achievementCounter = document.getElementById('achievementCounter');
        this.streakInfo = document.getElementById('streakInfo');
        this.streakDays = document.getElementById('streakDays');
        // User profile elements (shown when authenticated)
        this.userProfileContainer = document.getElementById('userProfileContainer');
        this.userProfileButton = document.getElementById('userProfileButton');
        this.userProfileDropdown = document.getElementById('userProfileDropdown');
        this.userDropdownMenu = document.getElementById('userDropdownMenu');
        this.userAvatar = document.getElementById('userAvatar');
        this.logoutButton = document.getElementById('logoutButton');
        this.resetStatsButton = document.getElementById('resetStatsButton');
        
        // Logout modal elements
        this.logoutModalOverlay = document.getElementById('logoutModalOverlay');
        this.logoutModalMessage = document.getElementById('logoutModalMessage');
        
        // Feedback modal elements
        this.feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
        this.feedbackText = document.getElementById('feedbackText');
        this.confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        this.cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        
        // Integration Modal elements
        this.integrationModalOverlay = document.getElementById('integrationModalOverlay');
        this.integrationModalMessage = document.getElementById('integrationModalMessage');
        this.closeIntegrationModalX = document.getElementById('closeIntegrationModalX');
        this.integrationModalPrimaryBtn = document.getElementById('integrationModalPrimaryBtn');
        this.integrationModalSecondaryBtn = document.getElementById('integrationModalSecondaryBtn');
        
        // Guest task limit modal elements
        this.guestTaskLimitModalOverlay = document.getElementById('guestTaskLimitModalOverlay');
        this.guestTaskLimitSignupBtn = document.getElementById('guestTaskLimitSignupBtn');
        this.guestTaskLimitCancelBtn = document.getElementById('guestTaskLimitCancelBtn');
        
        
        
        // Auth state
        this.isAuthenticated = false;
        this.user = null;
        this.isPro = false;
        // Signals when Clerk auth has fully hydrated for this session
        this.authReady = false;
        
        // Loading screen management
        this.loadingScreen = document.getElementById('loadingScreen');
        this.isLoading = false;
        this.loadingStartTime = null;
        this.minLoadingTime = 0; // No enforced minimum - never delay normal users
        
        // Task form state
        this.editingTaskId = null;
        
        // Audio state
        this.currentAudio = null;
        this.cassetteSounds = null;
        
        // Selection restore flags
        this.hasAppliedSavedTechnique = false;
        this.pendingSelectedTechnique = null;

        this.init();
        
        // Mark window as active to detect if it was closed vs refreshed
        sessionStorage.setItem('windowActive', 'true');
        
        // Listen for window close events
        window.addEventListener('beforeunload', () => {
            sessionStorage.removeItem('windowActive');
        });
        
        // Also listen for visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab is hidden, but window is still open
                // Keep windowActive flag
            } else {
                // Tab is visible again, ensure windowActive flag exists
                sessionStorage.setItem('windowActive', 'true');
            }
        });
    }
    
    // Mixpanel Analytics Functions
    trackEvent(eventName, properties = {}) {
        console.log('🔍 Attempting to track event:', eventName);
        console.log('🔍 Mixpanel available:', typeof window.mixpanel);
        console.log('🔍 Mixpanel track function:', typeof window.mixpanel?.track);
        
        if (typeof window.mixpanel !== 'undefined' && window.mixpanel.track) {
            try {
                const eventProperties = {
                    ...properties,
                    timestamp: new Date().toISOString(),
                    user_authenticated: this.isAuthenticated,
                    user_pro: this.isPro,
                    user_id: this.user?.id || 'guest'
                };
                
                window.mixpanel.track(eventName, eventProperties);
                console.log('✅ Event tracked successfully:', eventName, eventProperties);
            } catch (error) {
                console.error('❌ Error tracking event:', error);
            }
        } else {
            console.warn('⚠️ Mixpanel not available or track function missing');
        }
    }
    
    identifyUser() {
        if (this.isAuthenticated && this.user && typeof window.mixpanel !== 'undefined') {
            try {
                window.mixpanel.identify(this.user.id);
                window.mixpanel.people.set({
                    '$email': this.user.emailAddresses[0]?.emailAddress,
                    '$name': this.user.fullName,
                    'pro_user': this.isPro,
                    'signup_date': this.user.createdAt
                });
                console.log('✅ User identified:', this.user.id);
            } catch (error) {
                console.error('❌ Error identifying user:', error);
            }
        }
    }
    
    getCurrentTaskCount() {
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            return tasks.length;
        } catch (error) {
            return 0;
        }
    }
    
    init() {
        this.layoutSegments();
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateSessionInfo();
        this.updateStreakDisplay();
        this.bindEvents();
        this.updateTechniqueTitle();
        this.loadAudio();
        this.loadCassetteSounds();
        this.loadTronAssets();
        this.updateNavigationButtons();
        this.initClerk();
        
        // Apply saved background and overlay on init
        // Initialize new theme system (default to lofi)
        // Load last selected theme from localStorage (works for both authenticated and guest users)
        const lastSelectedTheme = localStorage.getItem('lastSelectedTheme');
        // Track if we must defer Tron application until auth hydrates
        this.pendingThemeApply = null;
        if (lastSelectedTheme) {
            this.currentTheme = lastSelectedTheme;
            if (lastSelectedTheme === 'tron') {
                // Don't decide yet based on auth = false (not hydrated). Defer applying.
                this.pendingThemeApply = 'tron';
            }
        } else {
            this.currentTheme = 'lofi'; // Only default when nothing saved
        }
        
            // Clear any saved immersive theme for guests
        if (!this.isAuthenticated) {
            this.currentImmersiveTheme = 'none';
        }
        this.overlayOpacity = parseFloat(localStorage.getItem('themeOverlayOpacity')) || 0.20;
        
        // Apply theme now only if not deferring Tron until auth hydration
        if (this.pendingThemeApply !== 'tron') {
            this.applyTheme(this.currentTheme);
        }
        
        this.applyOverlay(this.overlayOpacity);
        
        // Initialize tasks for each focus session
        this.initializeSessionTasks();
        
        // Add click handler to open task modal
        if (this.currentTaskElement) {
            this.currentTaskElement.style.cursor = 'pointer';
            this.currentTaskElement.addEventListener('click', () => {
                this.toggleTaskList();
            });
        }
        
        // Load custom timer labels if it exists (do not auto-select here)
        this.loadSavedCustomTimer();


        // Try to apply saved technique (will re-run after auth hydrates)
        this.applySavedTechniqueOnce();
        
        // For guest users, ensure Pomodoro is selected by default in UI
        if (!this.isAuthenticated) {
            this.setDefaultTechniqueForGuest();
        }
        // Welcome modal removed
        
        // Pomodoro intro modal removed
        
        // Additional check when page is fully loaded
        if (document.readyState === 'complete') {
            setTimeout(() => this.checkAuthState(), 2000);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.checkAuthState(), 2000);
            });
        }
        
        // Ensure logout button is properly bound after DOM is fully loaded
        window.addEventListener('load', () => {
            this.ensureLogoutButtonBinding();
        });

        // Build task queue at startup
        this.rebuildTaskQueue();

        // Update task button state on startup
        this.updateTaskButtonState();

        // Ensure badge shows current total focus time immediately
        this.updateFocusHoursDisplay();

        // Try to load saved timer state (must be last to ensure all UI is ready)
        // Uses sessionStorage so state persists on reload/navigation but not when closing tab
        setTimeout(() => {
            this.loadTimerState();
        }, 500);
    }

    // Clerk Authentication Methods
    async initClerk() {
        try {
            console.log('Initializing Clerk...');
            await this.waitForClerk();
            console.log('Clerk loaded, waiting for user...');
            
            // Load Clerk with configuration to hide development banner
            await window.Clerk.load({
                appearance: {
                    elements: {
                        '::before': { content: 'none' }
                    }
                },
                publishableKey: 'pk_live_Y2xlcmsuc3VwZXJmb2N1cy5saXZlJA'
            });
            
            // Hydrate initial auth state
            this.isAuthenticated = !!window.Clerk.user;
            this.user = window.Clerk.user;
            console.log('Initial auth state:', { isAuthenticated: this.isAuthenticated, user: this.user });
            
            // Clear Todoist tasks if user is not authenticated on initial load
            if (!this.isAuthenticated) {
                this.clearTodoistTasks();
            }

            // If coming from a Clerk redirect, remove Clerk params from URL
            this.stripClerkParamsFromUrl();

            // Poll briefly to ensure user is hydrated after redirect
            await this.waitForUserHydration(3000);
            
            // Listen for auth state changes where supported
            try {
                window.Clerk.addListener('user', (user) => {
                    console.log('Auth state changed:', user);
                    this.isAuthenticated = !!user;
                    this.user = user;
                    this.updateAuthState();
                });
            } catch (_) {}
            
            // Also listen for session changes
            try {
                window.Clerk.addListener('session', (session) => {
                    console.log('Session changed:', session);
                    this.isAuthenticated = !!session;
                    this.user = window.Clerk.user;
                    this.updateAuthState();
                });
            } catch (_) {}
            
            // Listen for auth state changes after redirect
            try {
                window.Clerk.addListener('auth', (auth) => {
                    console.log('Auth state changed:', auth);
                    this.isAuthenticated = !!auth.user;
                    this.user = auth.user;
                    this.updateAuthState();
                });
            } catch (_) {}
            
            // Wait a bit more for Clerk to fully hydrate before updating UI
            setTimeout(() => {
            this.updateAuthState();
            // Auth may have hydrated; attempt to apply saved technique now
            this.applySavedTechniqueOnce();
            }, 500);
            
            // Force check auth state after a short delay to catch post-redirect state
            setTimeout(() => {
                this.checkAuthState();
            }, 1000);
            
            // Additional check after longer delay to ensure UI updates
            setTimeout(() => {
                this.checkAuthState();
            }, 3000);

            // Mark auth system as ready and re-run UI gates that depend on it
            this.authReady = true;
            // Ensure techniques reflect correct state (guest vs free vs pro)
            try { this.updateDropdownItemsState(); } catch (_) {}
            // Removed extra welcome modal trigger to avoid duplicate rendering
        } catch (error) {
            console.error('Clerk initialization failed:', error);
        }
    }

    // Remove any Clerk-specific query params from URL to avoid sticky auth state
    stripClerkParamsFromUrl() {
        try {
            const url = new URL(window.location.href);
            const params = url.searchParams;
            let changed = false;
            // Remove any param that starts with __clerk_
            [...params.keys()].forEach((key) => {
                if (key.startsWith('__clerk_')) {
                    params.delete(key);
                    changed = true;
                }
            });
            if (changed) {
                window.history.replaceState({}, '', `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}${url.hash}`);
            }
        } catch (_) { /* ignore */ }
    }
    
    checkAuthState() {
        try {
            if (window.Clerk) {
                const currentUser = window.Clerk.user;
                const currentSession = window.Clerk.session;
                
                if (currentUser || currentSession) {
                    this.isAuthenticated = true;
                    this.user = currentUser;
                    this.updateAuthState();
                    console.log('Auth state verified:', { user: currentUser, session: currentSession });
                } else {
                    // Only update to unauthenticated if we're sure there's no user
                    // This prevents showing login modal when user is actually authenticated
                    if (this.isAuthenticated === false) {
                        this.user = null;
                        this.updateAuthState();
                        console.log('No authenticated user found');
                    }
                }
            }
        } catch (error) {
            console.log('Auth state check failed:', error);
        }
    }

    async waitForUserHydration(timeoutMs) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (window.Clerk && window.Clerk.user) {
                this.user = window.Clerk.user;
                this.isAuthenticated = true;
                return;
            }
            await new Promise(r => setTimeout(r, 200));
        }
    }
    
    async waitForClerk() {
        return new Promise((resolve) => {
            if (window.Clerk) {
                resolve();
                return;
            }
            
            const checkClerk = () => {
                if (window.Clerk) {
                    resolve();
                } else {
                    setTimeout(checkClerk, 100);
                }
            };
            
            checkClerk();
        });
    }
    
    debugAuthState() {
        try {
            console.log('🔍 Auth Debug Info:');
            console.log('- isAuthenticated:', this.isAuthenticated);
            console.log('- user:', this.user);
            console.log('- Clerk exists:', !!window.Clerk);
            console.log('- Clerk.user:', window.Clerk?.user);
            console.log('- Clerk.session:', window.Clerk?.session);
            console.log('- localStorage hasAccount:', localStorage.getItem('hasAccount'));
            console.log('- sessionStorage just_logged_out:', sessionStorage.getItem('just_logged_out'));
            
            // Check for multiple account issues
            if (window.Clerk?.user && !this.isAuthenticated) {
                console.warn('⚠️ Potential multiple account issue: Clerk has user but app shows not authenticated');
                console.log('Attempting to sync auth state...');
                this.isAuthenticated = true;
                this.user = window.Clerk.user;
            }
            
            // Check for session conflicts
            if (this.isAuthenticated && !window.Clerk?.user) {
                console.warn('⚠️ Session conflict: App shows authenticated but Clerk has no user');
                console.log('Clearing auth state...');
                this.isAuthenticated = false;
                this.user = null;
            }
            
            // Check for button/panel functionality issues
            this.debugPanelFunctionality();
            
        } catch (error) {
            console.error('Debug auth state error:', error);
        }
    }
    
    debugPanelFunctionality() {
        try {
            console.log('🔧 Panel Functionality Debug:');
            
            // Check if panels are properly initialized
            const taskPanel = document.getElementById('taskSidePanel');
            const timerPanel = document.getElementById('settingsSidePanel');
            const musicPanel = document.getElementById('musicSidePanel');
            
            console.log('- Task Panel exists:', !!taskPanel);
            console.log('- Timer Panel exists:', !!timerPanel);
            console.log('- Music Panel exists:', !!musicPanel);
            
            // Check if event listeners are working
            if (taskPanel) {
                const taskButtons = taskPanel.querySelectorAll('button');
                console.log('- Task Panel buttons:', taskButtons.length);
            }
            
            if (timerPanel) {
                const timerButtons = timerPanel.querySelectorAll('button');
                console.log('- Timer Panel buttons:', timerButtons.length);
            }
            
            if (musicPanel) {
                const musicButtons = musicPanel.querySelectorAll('button');
                console.log('- Music Panel buttons:', musicButtons.length);
            }
            
            // Check for disabled states
            const disabledButtons = document.querySelectorAll('button[disabled]');
            console.log('- Disabled buttons:', disabledButtons.length);
            
            // Check for opacity issues
            const lowOpacityElements = document.querySelectorAll('[style*="opacity: 0.5"]');
            console.log('- Low opacity elements:', lowOpacityElements.length);
            
            // Check for pointer-events issues
            const noPointerElements = document.querySelectorAll('[style*="pointer-events: none"]');
            console.log('- No pointer events elements:', noPointerElements.length);
            
        } catch (error) {
            console.error('Debug panel functionality error:', error);
        }
    }
    
    // Force clear all auth state to resolve multiple account issues
    forceClearAuthState() {
        try {
            console.log('🧹 Force clearing all auth state...');
            
            // Clear app state
            this.isAuthenticated = false;
            this.user = null;
            this.isPro = false;
            
            // Clear localStorage
            localStorage.removeItem('hasAccount');
            localStorage.removeItem('selectedImmersiveTheme');
            localStorage.removeItem('lastSelectedTheme');
            
            // Clear sessionStorage
            sessionStorage.removeItem('just_logged_out');
            
            // Clear Clerk state if possible
            if (window.Clerk && window.Clerk.signOut) {
                try {
                    window.Clerk.signOut();
                } catch (e) {
                    console.log('Could not sign out from Clerk:', e);
                }
            }
            
            // Clear Todoist tasks
            this.clearTodoistTasks();
            
            // Update UI
            this.updateAuthState();
            
            console.log('✅ Auth state cleared successfully');
            
            // Make function available globally for debugging
            window.debugAuth = () => this.debugAuthState();
            window.clearAuth = () => this.forceClearAuthState();
            window.fixPanels = () => this.forceReinitializePanels();
            console.log('🔧 Debug functions available: window.debugAuth(), window.clearAuth(), window.fixPanels()');
            
        } catch (error) {
            console.error('Error clearing auth state:', error);
        }
    }
    
    // Force reinitialize panels to fix button/action issues
    forceReinitializePanels() {
        try {
            console.log('🔧 Force reinitializing panels...');
            
            // Re-setup Timer panel
            const timerPanel = document.getElementById('settingsSidePanel');
            if (timerPanel) {
                console.log('Re-setting up Timer panel...');
                this.setupTimerSidebar();
            }
            
            // Re-setup Task panel
            const taskPanel = document.getElementById('taskSidePanel');
            if (taskPanel) {
                console.log('Re-setting up Task panel...');
                this.setupTaskSidebar();
            }
            
            // Re-setup Music panel
            const musicPanel = document.getElementById('musicSidePanel');
            if (musicPanel) {
                console.log('Re-setting up Music panel...');
                this.setupMusicSidebar();
            }
            
            // Force update auth state
            this.updateAuthState();
            
            console.log('✅ Panels reinitialized successfully');
            
        } catch (error) {
            console.error('Error reinitializing panels:', error);
        }
    }
    
    // Auto-fix common panel issues for authenticated users
    autoFixPanelIssues() {
        try {
            console.log('🔧 Auto-fixing panel issues...');
            
            // Fix disabled buttons in panels
            const panels = ['taskSidePanel', 'settingsSidePanel', 'musicSidePanel'];
            panels.forEach(panelId => {
                const panel = document.getElementById(panelId);
                if (panel) {
                    const buttons = panel.querySelectorAll('button');
                    buttons.forEach(button => {
                        if (button.disabled && this.isAuthenticated) {
                            console.log(`Enabling disabled button in ${panelId}:`, button.textContent);
                            button.disabled = false;
                            button.style.opacity = '1';
                            button.style.cursor = 'pointer';
                        }
                    });
                }
            });
            
            // Fix low opacity elements
            const lowOpacityElements = document.querySelectorAll('[style*="opacity: 0.5"]');
            lowOpacityElements.forEach(element => {
                if (this.isAuthenticated) {
                    console.log('Fixing low opacity element:', element);
                    element.style.opacity = '1';
                    element.style.pointerEvents = 'auto';
                    element.style.cursor = 'auto';
                }
            });
            
            // Fix pointer-events: none elements
            const noPointerElements = document.querySelectorAll('[style*="pointer-events: none"]');
            noPointerElements.forEach(element => {
                if (this.isAuthenticated) {
                    console.log('Fixing no pointer events element:', element);
                    element.style.pointerEvents = 'auto';
                }
            });
            
            console.log('✅ Panel issues auto-fixed');
            
        } catch (error) {
            console.error('Error auto-fixing panel issues:', error);
        }
    }
    
    // Enable Timer panel features for authenticated users
    enableTimerPanelFeatures() {
        try {
            console.log('🔓 Enabling Timer panel features for authenticated user');
            
            // Enable sessions card
            const sessionsSlider = document.querySelector('#sidebarSessionsSlider');
            const sessionsValue = document.querySelector('#sidebarSessionsValue');
            const sessionsCard = sessionsSlider?.closest('.duration-item');
            
            if (sessionsSlider && sessionsValue && sessionsCard) {
                sessionsCard.style.opacity = '1';
                sessionsCard.style.pointerEvents = 'auto';
                sessionsCard.style.cursor = 'auto';
                sessionsValue.textContent = `${this.sessionsPerCycle} sesh`;
            }
            
            // Enable Long Break card
            const longBreakSlider = document.querySelector('#sidebarLongBreakSlider');
            const longBreakCard = longBreakSlider?.closest('.duration-item');
            
            if (longBreakSlider && longBreakCard) {
                longBreakCard.style.opacity = '1';
                longBreakCard.style.pointerEvents = 'auto';
                longBreakCard.style.cursor = 'auto';
            }
            
            // Enable advanced techniques
            const techniquePresets = document.querySelectorAll('.technique-preset');
            techniquePresets.forEach(preset => {
                const technique = preset.dataset.technique;
                if (technique !== 'pomodoro') {
                    preset.style.opacity = '1';
                    preset.style.cursor = 'pointer';
                    preset.style.pointerEvents = 'auto';
                    
                    // Hide "(Sign up required)" text
                    const signupText = preset.querySelector('.signup-required-text');
                    if (signupText) {
                        signupText.classList.add('hidden');
                    }
                }
            });
            
            // Hide "(Sign up required)" text from sessions and long break labels
            const sessionsSignupText = document.querySelector('#sidebarSessionsSlider')?.closest('.duration-item')?.querySelector('.signup-required-text');
            if (sessionsSignupText) {
                sessionsSignupText.classList.add('hidden');
            }
            
            const longBreakSignupText = document.querySelector('#sidebarLongBreakSlider')?.closest('.duration-item')?.querySelector('.signup-required-text');
            if (longBreakSignupText) {
                longBreakSignupText.classList.add('hidden');
            }
            
            // Initialize save button as disabled (will be enabled when changes are made)
            const saveBtn = document.querySelector('#sidebarSaveSettings');
            if (saveBtn) {
                saveBtn.disabled = true;
            }
            
            console.log('✅ Timer panel features enabled');
            
        } catch (error) {
            console.error('Error enabling Timer panel features:', error);
        }
    }

    enableSaveButton() {
        const saveBtn = document.querySelector('#sidebarSaveSettings');
        if (saveBtn && this.isAuthenticated) {
            saveBtn.disabled = false;
        }
    }

    resetSaveButton() {
        const saveBtn = document.querySelector('#sidebarSaveSettings');
        if (saveBtn) {
            saveBtn.disabled = true;
        }
    }
    
    updateAuthState() {
        console.log('Updating auth state:', { isAuthenticated: this.isAuthenticated, user: this.user });
        
        // Debug multiple account issues
        this.debugAuthState();
        
        // If we just logged out, do NOT rehydrate from Clerk even if window.Clerk.user still exists momentáneamente
        let justLoggedOut = false;
        try { justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true'; } catch (_) {}

        // Force check current auth state from Clerk unless we just logged out
        if (window.Clerk && window.Clerk.user && !justLoggedOut) {
            this.isAuthenticated = true;
            this.user = window.Clerk.user;
        }
        
        // Update Pro status
        const wasPro = this.isPro;
        this.isPro = this.isPremiumUser();
        
        // Track Pro conversion if user just became Pro
        if (!wasPro && this.isPro && this.isAuthenticated) {
            this.trackEvent('User Upgraded to Pro', {
                user_id: this.user?.id,
                email: this.user?.emailAddresses[0]?.emailAddress,
                conversion_type: 'free_to_pro',
                user_journey: 'free → pro',
                source: 'stripe_webhook',
                revenue: 9.0,
                timestamp: new Date().toISOString()
            });
        }
        
        if (this.isAuthenticated && this.user) {
            try { localStorage.setItem('hasAccount', 'true'); } catch (_) {}
            
            // Track user authentication (first time or returning)
            this.trackEvent('User Authenticated', {
                user_id: this.user.id,
                email: this.user.emailAddresses[0]?.emailAddress,
                is_pro: this.isPro,
                signup_date: this.user.createdAt,
                authentication_type: 'clerk_auth'
            });
            
            // Identify user in Mixpanel
            this.identifyUser();
            
            // Enable Timer panel features for authenticated users
            this.enableTimerPanelFeatures();
            
            // Auto-fix panel issues for authenticated users
            this.autoFixPanelIssues();
            
            // 🎯 Track User Login event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackUserLogin('clerk');
                console.log('📊 User login event tracked to Mixpanel');
            }
            
            if (this.authContainer) this.authContainer.style.display = 'none';
            if (this.userProfileContainer) this.userProfileContainer.style.display = 'none'; // Always hidden, use settings menu instead
            // Always show logo, never show achievement icon
            if (this.logoIcon) this.logoIcon.style.display = 'flex';
            if (this.achievementIcon) this.achievementIcon.style.display = 'none';
            // Streak info is now always visible via CSS
            this.updateUserProfile();
            // Initialize cycle counter for authenticated users
            this.initializeCycleCounter();
            // Also update badge immediately
            this.updateFocusHoursDisplay();
            // Update premium UI
            this.updatePremiumUI();
            // Reconciliar premium desde backend
            this.refreshPremiumFromServer().catch(() => {});
            
            // Ensure cassette auth gating and saved Tron theme are applied post-hydration
            try { this.updateThemeAuthState(); } catch (_) {}
            try {
                const savedTheme = localStorage.getItem('lastSelectedTheme');
                // If we deferred Tron application, and user is authenticated now, apply it
                if (this.pendingThemeApply === 'tron' && this.isAuthenticated) {
                    console.log('🎨 Auth hydrated: applying deferred Tron theme');
                    this.applyTheme('tron');
                    this.pendingThemeApply = null;
                } else if (savedTheme && savedTheme !== this.currentTheme) {
                    // Ensure saved cassette is honored
                    this.applyTheme(savedTheme);
                }
            } catch (_) {}
            // Check admin access for Developer tab
            this.checkAdminAccess();
            // Welcome modal removed
            // Hide loading screen when user is authenticated
            this.hideLoadingScreen();
            console.log('User is authenticated, showing profile avatar');
            
            // Update settings dropdown for authenticated user
            if (this.settingsUserInfo) this.settingsUserInfo.style.display = 'flex';
            if (this.settingsAuthSection) this.settingsAuthSection.style.display = 'none';
            
            // Add authenticated-user class to dropdown for proper width handling
            if (this.settingsDropdown) {
                this.settingsDropdown.classList.add('authenticated-user');
            }
            if (this.settingsAccountSection) this.settingsAccountSection.style.display = 'block';
            if (this.settingsReportSection) this.settingsReportSection.style.display = 'block';
            if (this.settingsSettingsSection) this.settingsSettingsSection.style.display = 'none';
            if (this.settingsLogoutBtn) this.settingsLogoutBtn.style.display = 'flex';
            if (this.settingsLogoutDivider) this.settingsLogoutDivider.style.display = 'block';
            
            // Hide timer header auth buttons when authenticated
            const timerHeaderAuth = document.getElementById('timerHeaderAuth');
            if (timerHeaderAuth) timerHeaderAuth.style.display = 'none';
            
            // Show Focus Report header when authenticated
            const timerHeaderFocusReport = document.getElementById('timerHeaderFocusReport');
            if (timerHeaderFocusReport) timerHeaderFocusReport.style.display = 'block';
            
            // Hide content section and footer when authenticated (only show timer)
            const contentSection = document.querySelector('.content-section');
            const mainFooter = document.querySelector('.main-footer');
            if (contentSection) contentSection.style.display = 'none';
            if (mainFooter) mainFooter.style.display = 'none';
            
            // Update user display name in settings dropdown (First name if available, email if not)
            if (this.settingsUserEmail && this.user) {
                const firstName = this.user.firstName;
                const email = this.user.primaryEmailAddress?.emailAddress || this.user.emailAddresses?.[0]?.emailAddress;
                
                // Use first name if available, otherwise use email
                const displayName = firstName || email || 'User';
                this.settingsUserEmail.textContent = displayName;
            }


            // Apply saved technique now that auth is ready
            this.applySavedTechniqueOnce();
            // Restore user's saved volume preference when authenticated
            try {
                const savedVolume = localStorage.getItem('ambientVolume');
                if (savedVolume !== null) {
                    this.ambientVolume = Math.max(0, Math.min(1, parseFloat(savedVolume)));
                    if (this.backgroundAudio) this.backgroundAudio.volume = this.ambientVolume;
                }
            } catch (_) {}
            
            // Restore user's saved music preferences when authenticated
            try {
                const savedAmbientEnabled = localStorage.getItem('ambientEnabled');
                if (savedAmbientEnabled !== null) {
                    this.ambientEnabled = savedAmbientEnabled === 'true';
                }
                const savedRainEnabled = localStorage.getItem('rainEnabled');
                if (savedRainEnabled !== null) {
                    this.rainEnabled = savedRainEnabled === 'true';
                }
            } catch (_) {}
        } else {
            // Double-check with Clerk before showing login UI
            if (window.Clerk && window.Clerk.user) {
                console.log('Clerk user found, updating auth state');
                this.isAuthenticated = true;
                this.user = window.Clerk.user;
                // Recursively call updateAuthState to handle authenticated case
                this.updateAuthState();
                return;
            }
            
            // Reset Pro status for unauthenticated users
            this.isPro = false;
            
            // Reset technique ASAP for snappy UI when user is not authenticated
            this.resetToDefaultTechniqueIfNeeded();

            // Clear Todoist tasks when user is not authenticated
            this.clearTodoistTasks();
            
            if (this.authContainer) this.authContainer.style.display = 'none'; // Always hidden, use settings menu instead
            if (this.userProfileContainer) this.userProfileContainer.style.display = 'none';
            // Always show logo, never show achievement icon
            if (this.logoIcon) this.logoIcon.style.display = 'flex';
            if (this.achievementIcon) this.achievementIcon.style.display = 'none';
            // Streak info is now always visible via CSS
            if (this.loginButton) this.loginButton.textContent = 'Login';
            // Keep header buttons hidden - they're now in the settings menu
            if (this.signupButton) this.signupButton.style.display = 'none';
            if (this.loginButton) this.loginButton.style.display = 'none';
            console.log('User is not authenticated, showing settings menu with login/signup options');
            
            // Reset header settings button to show user icon (not logged in)
            if (this.headerSettingsIcon) this.headerSettingsIcon.style.display = 'block';
            if (this.headerSettingsAvatar) this.headerSettingsAvatar.style.display = 'none';
            
            // Update settings dropdown for non-authenticated user
            if (this.settingsUserInfo) this.settingsUserInfo.style.display = 'none';
            if (this.settingsAuthSection) this.settingsAuthSection.style.display = 'block';
            
            // Remove authenticated-user class from dropdown for guest users
            if (this.settingsDropdown) {
                this.settingsDropdown.classList.remove('authenticated-user');
            }
            if (this.settingsAccountSection) this.settingsAccountSection.style.display = 'none';
            if (this.settingsReportSection) this.settingsReportSection.style.display = 'none';
            if (this.settingsSettingsSection) this.settingsSettingsSection.style.display = 'block';
            if (this.settingsLogoutBtn) this.settingsLogoutBtn.style.display = 'none';
            if (this.settingsLogoutDivider) this.settingsLogoutDivider.style.display = 'none';
            
            // Show timer header auth buttons when not authenticated
            const timerHeaderAuth = document.getElementById('timerHeaderAuth');
            if (timerHeaderAuth) timerHeaderAuth.style.display = 'block';
            
            // Hide Focus Report header when not authenticated
            const timerHeaderFocusReport = document.getElementById('timerHeaderFocusReport');
            if (timerHeaderFocusReport) timerHeaderFocusReport.style.display = 'none';
            
            // Show content section and footer when not authenticated (guest user)
            const contentSection = document.querySelector('.content-section');
            const mainFooter = document.querySelector('.main-footer');
            if (contentSection) contentSection.style.display = 'block';
            if (mainFooter) mainFooter.style.display = 'block';
            
            // Reset badge to zero time for guests
            if (this.achievementCounter) {
                this.achievementCounter.textContent = '00h:00m';
            }
            // Ensure guest default volume (25%) when not authenticated
            // Don't override if user has a saved volume (they might logout and login again)
            const savedVolume = localStorage.getItem('ambientVolume');
            if (savedVolume === null) {
                this.ambientVolume = 0.25;
            if (this.backgroundAudio) this.backgroundAudio.volume = this.ambientVolume;
            }
            
            // Keep music state for logged-out users (they just can't change it)
            // Only new users without saved preferences will have 'false' by default (from initialization)
            // This allows logged-out users to maintain their previous music selection visually
        }
        
        // Update dropdown badges based on authentication state
        this.updateDropdownState();
        
        // Update streak display based on authentication state
        this.updateStreakDisplay();
        
        // Update dropdown items disabled state
        this.updateDropdownItemsState();
    }

    // Close all open modals to focus on timer
    closeAllModals() {
        // Close focus stats overlay (Tasks, Stats, etc.)
        const focusStatsOverlays = document.querySelectorAll('.focus-stats-overlay');
        focusStatsOverlays.forEach(overlay => {
            try { document.body.removeChild(overlay); } catch (_) {}
        });
        
        
        // Close logout modal
        const logoutModal = document.getElementById('logoutModalOverlay');
        if (logoutModal) logoutModal.style.display = 'none';
        
        // Close custom timer modal
        const customTimerModal = document.getElementById('customTimerModal');
        if (customTimerModal) customTimerModal.style.display = 'none';
        
        // Close upgrade modal
        const upgradeModal = document.querySelector('.upgrade-modal-overlay');
        if (upgradeModal) upgradeModal.style.display = 'none';
        
        // Close settings modal
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.style.display = 'none';
        
        // Close celebration modal
        const celebrationModal = document.querySelector('.celebration-modal-overlay');
        if (celebrationModal) celebrationModal.style.display = 'none';
        
        // Close technique dropdown
        if (this.techniqueDropdown) {
            this.techniqueDropdown.classList.remove('open');
        }
        
        // Close user profile dropdown
        if (this.userProfileDropdown) {
            this.userProfileDropdown.style.display = 'none';
        }
    }

    // Reset to default technique if current technique requires authentication
    resetToDefaultTechniqueIfNeeded() {
        const savedTechnique = localStorage.getItem('selectedTechnique');
        if (!savedTechnique) return;
        
        // Check if the saved technique requires authentication
        const proTechniques = ['pomodoro-plus', 'ultradian-rhythm', 'custom'];
        if (proTechniques.includes(savedTechnique)) {
            // Reset to default Pomodoro technique
            const alreadyPomodoro = savedTechnique === 'pomodoro';
            if (!alreadyPomodoro) {
                localStorage.setItem('selectedTechnique', 'pomodoro');
            }
            
            // Update UI to show Pomodoro
            if (this.techniqueTitle) {
                this.techniqueTitle.innerHTML = `Pomodoro<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
            }
            
            // Update dropdown selection to show check icon on Pomodoro
            if (this.dropdownItems) {
                this.dropdownItems.forEach(item => {
                    item.classList.remove('selected');
                    if (item.dataset.technique === 'pomodoro') {
                        item.classList.add('selected');
                    }
                });
            }
            
            // Load the default Pomodoro technique only if not already applied
            if (this.currentTechniqueKey !== 'pomodoro') {
                this.loadTechnique('pomodoro');
            }
        }
    }


    // Sync the settings panel technique selection with the main timer
    syncSettingsPanelTechnique(technique) {
        // Don't sync if technique is 'custom'
        if (technique === 'custom') {
            this.deselectTechniqueInPanel();
            return;
        }
        
        // For guest users, don't interfere with the default Pomodoro selection
        if (!this.isAuthenticated && technique === 'pomodoro') {
            console.log('✅ Guest user - keeping default Pomodoro selection');
            return;
        }
        
        // Use setTimeout to ensure the panel is rendered
        setTimeout(() => {
            const settingsPanel = document.getElementById('settingsSidePanel');
            if (!settingsPanel) {
                console.log('⚠️ Settings panel not found in DOM');
                return;
            }
            
            const techniquePresets = settingsPanel.querySelectorAll('.technique-preset');
            if (!techniquePresets.length) {
                console.log('⚠️ No technique presets found in panel');
                return;
            }
            
            // Remove active class from all presets
            techniquePresets.forEach(preset => {
                preset.classList.remove('active');
            });
            
            // Add active class to the matching technique
            const matchingPreset = Array.from(techniquePresets).find(preset => 
                preset.dataset.technique === technique
            );
            
            if (matchingPreset) {
                matchingPreset.classList.add('active');
                console.log(`✅ Settings panel synced with technique: ${technique}`);
                
                // Also update the sliders to reflect current settings
                this.updateSettingsPanelSliders();
            } else {
                console.log(`⚠️ Technique '${technique}' not found in settings panel`);
            }
        }, 100);
    }
    
    // Deselect technique in panel when user manually changes duration
    deselectTechniqueInPanel() {
        const settingsPanel = document.getElementById('settingsSidePanel');
        if (!settingsPanel) return;
        
        const techniquePresets = settingsPanel.querySelectorAll('.technique-preset');
        techniquePresets.forEach(preset => {
            preset.classList.remove('active');
        });
        
        console.log('🔄 Technique deselected due to manual duration change');
    }

    // Update the sliders in the settings panel to reflect current values
    updateSettingsPanelSliders() {
        const pomodoroSlider = document.getElementById('sidebarPomodoroSlider');
        const shortBreakSlider = document.getElementById('sidebarShortBreakSlider');
        const longBreakSlider = document.getElementById('sidebarLongBreakSlider');
        const sessionsSlider = document.getElementById('sidebarSessionsSlider');
        
        const pomodoroValue = document.getElementById('sidebarPomodoroValue');
        const shortBreakValue = document.getElementById('sidebarShortBreakValue');
        const longBreakValue = document.getElementById('sidebarLongBreakValue');
        const sessionsValue = document.getElementById('sidebarSessionsValue');
        
        if (pomodoroSlider && pomodoroValue) {
            const minutes = Math.floor(this.workTime / 60);
            pomodoroSlider.value = minutes;
            pomodoroValue.textContent = `${minutes} min`;
        }
        
        if (shortBreakSlider && shortBreakValue) {
            const minutes = Math.floor(this.shortBreakTime / 60);
            shortBreakSlider.value = minutes;
            shortBreakValue.textContent = `${minutes} min`;
        }
        
        if (longBreakSlider && longBreakValue) {
            const minutes = Math.floor(this.longBreakTime / 60);
            longBreakSlider.value = minutes;
            longBreakValue.textContent = `${minutes} min`;
        }
        
        if (sessionsSlider && sessionsValue) {
            sessionsSlider.value = this.sessionsPerCycle;
            sessionsValue.textContent = `${this.sessionsPerCycle} sesh`;
        }
    }

    // Apply saved technique once, after auth/user state is hydrated
    applySavedTechniqueOnce() {
        if (this.hasAppliedSavedTechnique) return;
        const saved = localStorage.getItem('selectedTechnique');
        const savedCustom = localStorage.getItem('customTimer');

        // Nothing saved → keep default until user picks one
        if (!saved) {
            this.hasAppliedSavedTechnique = true;
            return;
        }

        // Custom selected
        if (saved === 'custom') {
            // Check if we have custom durations saved (from manual changes)
            const savedPomodoroTime = localStorage.getItem('pomodoroTime');
            const savedShortBreakTime = localStorage.getItem('shortBreakTime');
            const savedLongBreakTime = localStorage.getItem('longBreakTime');
            const savedSessionsPerCycle = localStorage.getItem('sessionsPerCycle');
            
            if (savedPomodoroTime || savedShortBreakTime || savedLongBreakTime || savedSessionsPerCycle) {
                // Apply saved custom durations
                if (savedPomodoroTime) this.workTime = parseInt(savedPomodoroTime);
                if (savedShortBreakTime) this.shortBreakTime = parseInt(savedShortBreakTime);
                if (savedLongBreakTime) this.longBreakTime = parseInt(savedLongBreakTime);
                if (savedSessionsPerCycle) this.sessionsPerCycle = parseInt(savedSessionsPerCycle);
                
                // Update cycle sections with custom durations
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                
                // Update UI to reflect custom durations
                this.updateDisplay();
                this.updateProgress();
                this.updateSections();
                this.updateSessionInfo();
                this.updateCurrentSessionTask();
                
                console.log('✅ Applied saved custom configuration');
                this.hasAppliedSavedTechnique = true;
                return;
            }
            
            // Check for saved custom timer config
            if (savedCustom) {
                try {
                    const config = JSON.parse(savedCustom);
                    this.loadCustomTechnique(config);
                    this.hasAppliedSavedTechnique = true;
                    return;
                } catch (_) {
                    localStorage.removeItem('customTimer');
                    // No valid custom → mark applied and keep default
                    this.hasAppliedSavedTechnique = true;
                    return;
                }
            }
            // No custom saved → mark applied and keep default
            this.hasAppliedSavedTechnique = true;
            return;
        }

        // Built-in technique - load technique first
        const item = document.querySelector(`[data-technique="${saved}"]`);
        if (item) {
            this.selectTechnique(item);
            
            // After loading technique, check if there are saved custom durations
            // and apply them if they exist (user had customized the technique)
            const savedPomodoroTime = localStorage.getItem('pomodoroTime');
            const savedShortBreakTime = localStorage.getItem('shortBreakTime');
            const savedLongBreakTime = localStorage.getItem('longBreakTime');
            const savedSessionsPerCycle = localStorage.getItem('sessionsPerCycle');
            
            if (savedPomodoroTime || savedShortBreakTime || savedLongBreakTime || savedSessionsPerCycle) {
                // Apply saved custom durations
                if (savedPomodoroTime) this.workTime = parseInt(savedPomodoroTime);
                if (savedShortBreakTime) this.shortBreakTime = parseInt(savedShortBreakTime);
                if (savedLongBreakTime) this.longBreakTime = parseInt(savedLongBreakTime);
                if (savedSessionsPerCycle) this.sessionsPerCycle = parseInt(savedSessionsPerCycle);
                
                // Update cycle sections with custom durations
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                
                // Update UI to reflect custom durations
                this.updateDisplay();
                this.updateProgress();
                this.updateSections();
                this.updateSessionInfo();
                this.updateCurrentSessionTask();
                
                console.log('✅ Applied saved custom durations to technique');
            }
            
            // Sync settings panel with the loaded technique
            this.syncSettingsPanelTechnique(saved);
            
            this.hasAppliedSavedTechnique = true;
            return;
        }

        // Unknown saved technique → mark applied
        this.hasAppliedSavedTechnique = true;
    }

    updateUserProfile() {
        if (!this.user) return;
        
        // Update user display name in dropdown (First name if available, email if not)
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            const firstName = this.user.firstName;
            const email = this.user.primaryEmailAddress?.emailAddress || this.user.emailAddresses?.[0]?.emailAddress;
            
            // Use first name if available, otherwise use email
            const displayName = firstName || email || 'User';
            userEmailElement.textContent = displayName;
        }
        
        // Update user avatar
        if (this.user.imageUrl && this.userAvatar) {
            this.userAvatar.src = this.user.imageUrl;
        } else if (this.userAvatar) {
            const initials = this.getInitials(this.user.fullName || this.user.firstName || (this.user.emailAddresses?.[0]?.emailAddress || 'U'));
            const svg = `
                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <rect width="36" height="36" fill="#555" rx="18"/>
                    <text x="18" y="22" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${initials}</text>
                </svg>`;
            this.userAvatar.src = `data:image/svg+xml;base64,${btoa(svg)}`;
        }
        
        // Update header settings button with user profile image
        if (this.user.imageUrl && this.headerSettingsAvatar && this.headerSettingsIcon) {
            this.headerSettingsAvatar.src = this.user.imageUrl;
            this.headerSettingsAvatar.style.display = 'block';
            this.headerSettingsIcon.style.display = 'none';
        } else if (this.headerSettingsAvatar && this.headerSettingsIcon) {
            const initials = this.getInitials(this.user.fullName || this.user.firstName || (this.user.emailAddresses?.[0]?.emailAddress || 'U'));
            const svg = `
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" fill="#555" rx="16"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="11" font-weight="bold">${initials}</text>
                </svg>`;
            this.headerSettingsAvatar.src = `data:image/svg+xml;base64,${btoa(svg)}`;
            this.headerSettingsAvatar.style.display = 'block';
            this.headerSettingsIcon.style.display = 'none';
        }
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    showLogoutModal() {
        if (this.user && this.logoutModalMessage) {
            const userEmail = this.user.emailAddresses?.[0]?.emailAddress || 'user';
            this.logoutModalMessage.textContent = `Log out of True Tempo as ${userEmail}?`;
        }
        if (this.logoutModalOverlay) {
            this.logoutModalOverlay.style.display = 'flex';
        }
    }
    
    hideLogoutModal() {
        if (this.logoutModalOverlay) {
            this.logoutModalOverlay.style.display = 'none';
        }
    }

    showFeedbackModal() {
        if (this.feedbackModalOverlay) {
            this.feedbackModalOverlay.style.display = 'flex';
            // Clear previous feedback
            if (this.feedbackText) {
                this.feedbackText.value = '';
            }
        }
    }

    hideFeedbackModal() {
        if (this.feedbackModalOverlay) {
            this.feedbackModalOverlay.style.display = 'none';
        }
    }
    
    showIntegrationModal(integrationType) {
        if (this.integrationModalOverlay) {
            const integrationData = {
                todoist: {
                    message: 'Connect your Todoist account to sync tasks seamlessly!',
                    primaryText: this.isAuthenticated ? 'Upgrade to Pro' : 'Learn More',
                    secondaryText: this.isAuthenticated ? 'Learn more' : 'Cancel'
                },
                notion: {
                    message: 'Connect your Notion workspace to sync tasks seamlessly!',
                    primaryText: this.isAuthenticated ? 'Upgrade to Pro' : 'Learn More',
                    secondaryText: this.isAuthenticated ? 'Learn more' : 'Cancel'
                }
            };
            
            const data = integrationData[integrationType] || integrationData.todoist;
            
            this.integrationModalMessage.textContent = data.message;
            this.integrationModalPrimaryBtn.textContent = data.primaryText;
            this.integrationModalSecondaryBtn.textContent = data.secondaryText;
            
            this.integrationModalOverlay.style.display = 'flex';
        }
    }
    
    showTechniqueModal(technique) {
        
        // Get technique name
        const techniqueNames = {
            'sprint': 'Sprint',
            'focus': 'Focus', 
            'flow': 'Flow State',
            'marathon': 'Marathon',
            'deepwork': 'Deep Work'
        };
        
        const techniqueName = techniqueNames[technique] || 'Advanced Technique';
        
        // Create technique modal using exact same structure as Task limit reached
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'logout-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'logout-modal';
        
        modal.innerHTML = `
            <button class="close-logout-modal-x" id="closeTechniqueModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <h3 class="logout-modal-title">${techniqueName}</h3>
            <p class="logout-modal-message">Sign up to unlock advanced focus techniques and boost your productivity!</p>
            <div class="logout-modal-buttons">
                <button class="logout-modal-btn logout-modal-btn-primary" id="techniqueSignupBtn">Sign up</button>
                <button class="logout-modal-btn logout-modal-btn-secondary" id="techniqueLearnMoreBtn">Learn more</button>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Show modal
        modalOverlay.style.display = 'flex';
        
        // Event listeners
        const closeBtn = modal.querySelector('#closeTechniqueModal');
        const signupBtn = modal.querySelector('#techniqueSignupBtn');
        const learnMoreBtn = modal.querySelector('#techniqueLearnMoreBtn');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        
        signupBtn.addEventListener('click', () => {
            this.trackEvent('Signup from Technique Modal', {
                button_type: 'signup',
                source: 'technique_modal',
                technique_name: technique,
                user_type: this.isAuthenticated ? 'free_user' : 'guest',
                conversion_funnel: 'technique_interest'
            });
            closeModal();
            window.location.href = 'https://accounts.superfocus.live/sign-up?redirect_url=https%3A%2F%2Fwww.superfocus.live%2F%3Fsignup%3Dsuccess';
        });
        
        learnMoreBtn.addEventListener('click', () => {
            this.trackEvent('Learn More from Technique Modal', {
                button_type: 'learn_more',
                source: 'technique_modal',
                technique_name: technique
            });
            closeModal();
            window.open('/pricing/', '_blank');
        });
    }
    
    hideIntegrationModal() {
        if (this.integrationModalOverlay) {
            this.integrationModalOverlay.style.display = 'none';
        }
    }
    
    showTaskLimitModal() {
        if (this.guestTaskLimitModalOverlay) {
            
            // Update modal content based on user type
            const title = this.guestTaskLimitModalOverlay.querySelector('.logout-modal-title');
            const message = this.guestTaskLimitModalOverlay.querySelector('.logout-modal-message');
            const button = this.guestTaskLimitModalOverlay.querySelector('#guestTaskLimitSignupBtn');
            
            if (!this.isAuthenticated) {
                // Guest user
                title.textContent = 'Task limit reached';
                message.textContent = 'Guest users can have up to 1 active task. Sign up to create unlimited tasks and unlock all features!';
                button.textContent = 'Sign up';
            } else {
                // Free user (authenticated but not Pro)
                title.textContent = 'Task limit reached';
                message.textContent = 'Free users can have up to 5 active tasks. Upgrade to Pro for unlimited tasks and unlock all productivity features!';
                button.textContent = 'Upgrade to Pro';
            }
            
            this.guestTaskLimitModalOverlay.style.display = 'flex';
        }
    }
    
    showGuestTaskLimitModal() {
        if (this.guestTaskLimitModalOverlay) {
            this.guestTaskLimitModalOverlay.style.display = 'flex';
        }
    }
    
    hideGuestTaskLimitModal() {
        if (this.guestTaskLimitModalOverlay) {
            this.guestTaskLimitModalOverlay.style.display = 'none';
        }
    }
    
    
    
    
    async submitFeedback() {
        const feedbackText = this.feedbackText?.value?.trim();
        
        if (!feedbackText) {
            alert('Please enter your feedback before submitting.');
            return;
        }

        if (!this.user) {
            alert('Please log in to submit feedback.');
            return;
        }

        try {
            // Store feedback locally for admin panel
            const feedbackData = {
                id: Date.now().toString(),
                feedback: feedbackText,
                userEmail: this.user.primaryEmailAddress?.emailAddress || this.user.emailAddresses?.[0]?.emailAddress,
                userId: this.user.id,
                timestamp: new Date().toISOString(),
                status: 'new'
            };

            // Store in localStorage for admin panel
            let localFeedback = [];
            try {
                const stored = localStorage.getItem('superfocus_feedback');
                if (stored) {
                    localFeedback = JSON.parse(stored);
                }
            } catch (e) {
                localFeedback = [];
            }

            localFeedback.push(feedbackData);
            localStorage.setItem('superfocus_feedback', JSON.stringify(localFeedback));

            // Also send to API for logging
            const response = await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feedback: feedbackText,
                    userEmail: this.user.primaryEmailAddress?.emailAddress || this.user.emailAddresses?.[0]?.emailAddress,
                    userId: this.user.id
                })
            });

            if (response.ok) {
                alert('Thank you for your feedback! We appreciate your input.');
                this.hideFeedbackModal();
            } else {
                // Even if API fails, local storage worked
                alert('Thank you for your feedback! We appreciate your input.');
                this.hideFeedbackModal();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Sorry, there was an error submitting your feedback. Please try again.');
        }
    }
    
    ensureLogoutButtonBinding() {
        // Ensure logout button is properly bound
        const confirmBtn = document.getElementById('confirmLogoutBtn');
        if (confirmBtn && !confirmBtn.hasAttribute('data-bound')) {
            confirmBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                this.hideLogoutModal();
                await this.performLogout();
            });
            confirmBtn.setAttribute('data-bound', 'true');
        }
        
        const cancelBtn = document.getElementById('cancelLogoutBtn');
        if (cancelBtn && !cancelBtn.hasAttribute('data-bound')) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLogoutModal();
            });
            cancelBtn.setAttribute('data-bound', 'true');
        }
    }
    
    resetThemeAndMusicForGuest() {
        // Reset theme to minimalist if it's premium
        const currentTheme = localStorage.getItem('selectedTheme');
        // All themes are now available for guests, no reset needed
        
        // Reset music to none if it's premium
        if (this.rainEnabled || this.ambientEnabled) {
            this.stopRainPlaylist();
            this.stopAmbientPlaylist();
            this.rainEnabled = false;
            this.ambientEnabled = false;
            localStorage.setItem('rainEnabled', 'false');
            localStorage.setItem('ambientEnabled', 'false');
        }
        
        // Clear saved timer state (guests don't get session restore)
        sessionStorage.removeItem('timerState');
        
        console.log('🔄 Reset theme, music, and timer state to guest defaults');
    }

    async performLogout() {
        try {
            // 🎯 Track User Logout event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackUserLogout();
                console.log('📊 User logout event tracked to Mixpanel');
            }
            
            // Add loading state to confirm button
            if (this.confirmLogoutBtn) {
                this.confirmLogoutBtn.textContent = 'Logging out...';
                this.confirmLogoutBtn.disabled = true;
            }
            
            // Add fade out effect to the entire page
            document.body.style.transition = 'opacity 0.5s ease-out';
            document.body.style.opacity = '0.3';
            
            // Wait a moment for the fade effect
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Mark that user just logged out to prevent re-hydration and welcome modal
            try { sessionStorage.setItem('just_logged_out', 'true'); } catch (_) {}
            // Force clear any forced view mode and premium hints
            try {
                localStorage.removeItem('viewMode');
                localStorage.removeItem('hasAccount');
                localStorage.setItem('isPremium', 'false');
                localStorage.setItem('hasPaidSubscription', 'false');
            } catch (_) {}
            
            // Sign out from Clerk (all sessions) without adding extra query params FIRST
            try {
                await window.Clerk.signOut({ signOutAll: true });
            } catch (_) { /* ignore */ }

            // Now optimistic UI update to guest mode
            this.isAuthenticated = false;
            this.user = null;
            // Clear Todoist tasks when user logs out
            this.clearTodoistTasks();
            
            // Don't reset theme and music - keep them visible but disabled for logged out users
            // Only clear saved timer state (guests don't get session restore)
            sessionStorage.removeItem('timerState');
            
            this.updateAuthState();

            // Clean Clerk params and hard reload the page without query string
            this.stripClerkParamsFromUrl();
            const cleanUrl = `${window.location.origin}${window.location.pathname}`;
            window.location.replace(cleanUrl);
        } catch (err) {
            console.error('Logout failed:', err);
            // Reset button state on error
            if (this.confirmLogoutBtn) {
                this.confirmLogoutBtn.textContent = 'Log out';
                this.confirmLogoutBtn.disabled = false;
            }
            // Reset page opacity
            document.body.style.opacity = '1';
        }
    }
    
    async handleLogin() {
        try {
            if (this.isAuthenticated) {
                console.log('Showing logout confirmation...');
                this.showLogoutModal();
            } else {
                console.log('Redirecting to Clerk hosted Sign In...');
                
                // 🎯 Track Login Attempt event to Mixpanel
                if (window.mixpanelTracker) {
                    window.mixpanelTracker.trackCustomEvent('Login Attempt', {
                        method: 'clerk_redirect'
                    });
                    console.log('📊 Login attempt event tracked to Mixpanel');
                }
                
                // Fixed redirect to homepage as requested
                window.location.href = 'https://accounts.superfocus.live/sign-in?redirect_url=' + encodeURIComponent('https://www.superfocus.live/');
            }
        } catch (error) {
            console.error('Login/logout failed:', error);
        }
    }

    async handleSignup() {
        try {
            console.log('Redirecting to Clerk hosted Sign Up...');
            
            // 🎯 Track Signup Attempt event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackCustomEvent('Signup Attempt', {
                    method: 'clerk_redirect'
                });
                console.log('📊 Signup attempt event tracked to Mixpanel');
            }
            
            // Redirect to signup with success URL that includes signup=success parameter
            const successUrl = 'https://www.superfocus.live/?signup=success';
            const signupUrl = 'https://accounts.superfocus.live/sign-up?redirect_url=' + encodeURIComponent(successUrl);
            window.location.assign(signupUrl);
        } catch (error) {
            console.error('Sign up failed:', error);
        }
    }


    updateTechniqueTitle() {
        if (this.techniqueTitle) {
            const saved = localStorage.getItem('selectedTechnique');
            let label = 'Pomodoro';
            if (saved) {
                const map = {
                    'pomodoro': 'Pomodoro',
                    'pomodoro-plus': 'Long Pomodoro',
                    'ultradian-rhythm': 'Ultradian Rhythm',
                    'custom': (document.querySelector('[data-technique="custom"] .item-title')?.textContent || 'Custom')
                };
                label = map[saved] || 'Pomodoro';
            }
            this.techniqueTitle.innerHTML = `${label}<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
        }
    }
    
    toggleDropdown() {
        if (this.techniqueDropdown) {
            this.techniqueDropdown.classList.toggle('open');
        }
    }
    
    closeDropdown() {
        if (this.techniqueDropdown) {
            this.techniqueDropdown.classList.remove('open');
        }
    }
    
    selectTechnique(item) {
        if (!item) return;
        const technique = item.dataset ? item.dataset.technique : undefined;
        const titleEl = item.querySelector ? item.querySelector('.item-title') : null;
        const title = titleEl ? (titleEl.textContent || '') : '';
        if (!technique) return;
        const requiresAccount = item.dataset.requiresAccount === 'true';
        
        // Check if technique requires account and user is not authenticated
        if (requiresAccount && !this.isAuthenticated) {
            // Close dropdown
            this.closeDropdown();
            
            // Redirect to Clerk signup/login
            this.handleSignup();
            
            // Don't change technique
            return;
        }
        
        // Update the button text
        if (this.techniqueTitle) {
            const safeTitle = title || technique || '';
            this.techniqueTitle.innerHTML = `${safeTitle}<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
        }
        
        // Update selected state
        if (this.dropdownItems && this.dropdownItems.forEach) {
            this.dropdownItems.forEach(dropdownItem => {
                dropdownItem.classList.remove('selected');
            });
        }
        if (item.classList) item.classList.add('selected');
        
        // Save selected technique to localStorage
        localStorage.setItem('selectedTechnique', technique);
        
        // Close dropdown
        this.closeDropdown();
        
        // Here you could implement different timer configurations based on technique
        this.loadTechnique(technique);
        
        // Sync the settings panel with the selected technique
        this.syncSettingsPanelTechnique(technique);
    }
    
    loadTechnique(technique) {
        // Avoid redundant loads
        if (this.currentTechniqueKey === technique) {
            return;
        }

        // Different timer configurations based on technique
        switch(technique) {
            case 'sprint':
                this.workTime = 15 * 60;
                this.shortBreakTime = 3 * 60;
                this.longBreakTime = 10 * 60;
                this.sessionsPerCycle = 4;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                break;
            case 'pomodoro':
                this.workTime = 25 * 60;
                this.shortBreakTime = 5 * 60;
                this.longBreakTime = 15 * 60;
                this.sessionsPerCycle = 4;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                break;
            case 'focus':
                this.workTime = 30 * 60;
                this.shortBreakTime = 6 * 60;
                this.longBreakTime = 20 * 60;
                this.sessionsPerCycle = 4;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                break;
            case 'flow':
                this.workTime = 45 * 60;
                this.shortBreakTime = 8 * 60;
                this.longBreakTime = 25 * 60;
                this.sessionsPerCycle = 4;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                break;
            case 'marathon':
                this.workTime = 60 * 60;
                this.shortBreakTime = 10 * 60;
                this.longBreakTime = 30 * 60;
                this.sessionsPerCycle = 4;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                break;
            case 'deepwork':
                this.workTime = 90 * 60;
                this.shortBreakTime = 20 * 60;
                this.longBreakTime = 30 * 60;
                this.sessionsPerCycle = 2;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                ];
                break;
            case 'pomodoro-plus':
                this.workTime = 50 * 60;
                this.shortBreakTime = 10 * 60;
                this.longBreakTime = 0; // No long break for this technique
                this.sessionsPerCycle = 4;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                    { type: 'work', duration: this.workTime, name: 'Work 3' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                    { type: 'work', duration: this.workTime, name: 'Work 4' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 4' }
                ];
                break;
            case 'ultradian-rhythm':
                this.workTime = 90 * 60;
                this.shortBreakTime = 20 * 60;
                this.longBreakTime = 20 * 60; // Same as short break for simplicity
                this.sessionsPerCycle = 2;
                this.cycleSections = [
                    { type: 'work', duration: this.workTime, name: 'Work 1' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                    { type: 'work', duration: this.workTime, name: 'Work 2' },
                    { type: 'break', duration: this.shortBreakTime, name: 'Break 2' }
                ];
                break;
            case 'custom':
                // Load and apply saved custom configuration
                try {
                    const savedCustomTimer = localStorage.getItem('customTimer');
                    if (savedCustomTimer) {
                        const customConfig = JSON.parse(savedCustomTimer);
                        this.loadCustomTechnique(customConfig);
                        this.currentTechniqueKey = technique; // UI/state handled by loadCustomTechnique
                        return;
                    }
                } catch (_) {
                    try { localStorage.removeItem('customTimer'); } catch (_) {}
                }
                // No valid config; keep current technique until user configures
                return;
        }
        
        // Track applied technique key to short-circuit future loads
        this.currentTechniqueKey = technique;
        
        // Calculate required focus time for complete cycle
        this.calculateRequiredFocusTime();
        
        // Update progress ring to match new technique
        this.updateProgressRing();
        
        // Reset timer with new configuration
        this.pauseTimerSilent();
        this.currentSection = 1;
        this.loadCurrentSection();
        this.updateNavigationButtons();
        this.updateSessionInfo();
    }

    calculateRequiredFocusTime() {
        // Calculate total focus time required for a complete cycle
        this.requiredFocusTimeForCycle = 0;
        this.cycleSections.forEach(section => {
            if (section.type === 'work') {
                this.requiredFocusTimeForCycle += section.duration;
            }
        });
    }

    updateProgressRing() {
        // Get the progress segments container
        const progressSegments = document.querySelector('.progress-segments');
        if (!progressSegments) return;
        
        // Preserve existing opacity before clearing
        const existingOpacity = progressSegments.style.opacity || '';
        
        // Clear existing segments
        progressSegments.innerHTML = '';
        
        // Create all 8 segments for the complete cycle
        this.cycleSections.forEach((section, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', `progress-segment ${section.type === 'work' ? 'work-segment' : section.type === 'long-break' ? 'long-break-segment' : 'break-segment'}`);
            circle.setAttribute('data-section', (index + 1).toString());
            circle.setAttribute('data-minutes', Math.floor(section.duration / 60).toString());
            circle.setAttribute('cx', '50');
            circle.setAttribute('cy', '50');
            circle.setAttribute('r', '45');
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke-width', '4');
                circle.setAttribute('stroke', 'url(#liquidGlassOverlay)');
            
            progressSegments.appendChild(circle);
        });
            
        // Restore opacity if it existed
        if (existingOpacity) {
            progressSegments.style.opacity = existingOpacity;
        }
        
        // Update overlays: create 8 overlays for each section
        const progressOverlays = document.querySelector('.progress-overlays');
        if (progressOverlays) {
            // Preserve existing opacity before clearing
            const existingOverlayOpacity = progressOverlays.style.opacity || '';
            
            progressOverlays.innerHTML = '';
            
            // Create 8 overlays for each section
            for (let i = 1; i <= 8; i++) {
                const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                overlay.setAttribute('class', 'progress-overlay');
                overlay.setAttribute('data-ol', i.toString());
                overlay.setAttribute('cx', '50');
                overlay.setAttribute('cy', '50');
                overlay.setAttribute('r', '45');
                overlay.setAttribute('fill', 'none');
                overlay.setAttribute('stroke-width', '4');
                overlay.setAttribute('stroke-linecap', 'round');
                overlay.setAttribute('stroke-linejoin', 'round');
                overlay.setAttribute('stroke', 'url(#liquidGlassOverlay)');
                progressOverlays.appendChild(overlay);
            }
                
            // Restore opacity if it existed
            if (existingOverlayOpacity) {
                progressOverlays.style.opacity = existingOverlayOpacity;
            }
        }
        
        // Refresh cached NodeLists so subsequent layout uses the new elements
        this.progressSegments = document.querySelectorAll('.progress-segment');
        this.progressOverlays = document.querySelectorAll('.progress-overlay');

        // Re-layout segments with new configuration and update progress visuals
        this.layoutSegments();
        this.updateProgress();
    }

    // Minimal layout: ensure background circle is full and store circumference
    layoutSegments() {
        const CIRCUMFERENCE = 2 * Math.PI * 45; // 283
        this._segmentMeta = { CIRCUMFERENCE };

        // Ensure any existing background circle is a FULL circle (no dasharray)
        const bgSegments = document.querySelectorAll('.progress-segment');
        bgSegments.forEach(seg => {
            seg.removeAttribute('stroke-dasharray');
            seg.removeAttribute('stroke-dashoffset');
            seg.style.display = 'inline';
        });
    }
    bindEvents() {
        // Primary binding for Play/Pause button (original behavior)
        if (this.startPauseBtn) this.startPauseBtn.addEventListener('click', () => {
            this.trackEvent('Start Button Clicked', {
                button_type: 'start_pause',
                timer_state: this.isRunning ? 'running' : 'paused',
                current_section: this.currentSection
            });
            this.toggleTimer();
        });
        if (this.prevSectionBtn) this.prevSectionBtn.addEventListener('click', () => this.goToPreviousSection());
        if (this.nextSectionBtn) this.nextSectionBtn.addEventListener('click', () => this.goToNextSection());
        if (this.musicToggleBtn) this.musicToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMusic();
        });
        if (this.taskToggleBtn) this.taskToggleBtn.addEventListener('click', () => this.toggleTaskList());
        if (this.sessionLabelElement) this.sessionLabelElement.addEventListener('click', () => this.toggleTaskList());
        if (this.techniqueTitle) this.techniqueTitle.addEventListener('click', () => this.toggleDropdown());
        
        // Streak button event listener
        const streakInfo = document.getElementById('streakInfo');
        if (streakInfo) {
            streakInfo.addEventListener('click', () => {
                this.trackEvent('Focus Report Clicked', {
                    button_type: 'focus_report',
                    source: 'timer_header'
                });
                this.showStreakInfo();
            });
        }
        
        // Timer Settings button event listeners (footer legacy)
        const timerSettingsBtn = document.getElementById('timerSettingsBtn');
        if (timerSettingsBtn) {
            timerSettingsBtn.addEventListener('click', () => this.showTimerSettingsModal());
        }
        
        // Header Settings dropdown toggle
        if (this.headerSettingsBtn) {
            this.headerSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Track account button click in Google Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'account_button_click', {
                        'event_category': 'navigation',
                        'event_label': 'account_settings',
                        'value': 1
                    });
                    console.log('📊 Account button click tracked');
                }
                
                if (this.settingsDropdown) {
                    const isShown = this.settingsDropdown.style.display === 'block';
                    // Close user profile dropdown if open
                    if (this.userProfileDropdown) {
                        this.userProfileDropdown.style.display = 'none';
                    }
                    // Close help panel when closing settings dropdown
                    if (!isShown && this.helpPanel) {
                        this.helpPanel.style.display = 'none';
                    }
                    this.settingsDropdown.style.display = isShown ? 'none' : 'block';
                }
            });
        }
        
        // Settings dropdown - Login button
        if (this.settingsLoginBtn) {
            this.settingsLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Account Menu Login Clicked', {
                    button_type: 'login',
                    source: 'account_menu'
                });
                this.settingsDropdown.style.display = 'none';
                this.handleLogin();
            });
        }
        
        // Settings dropdown - Signup button
        if (this.settingsSignupBtn) {
            this.settingsSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Account Menu Signup Clicked', {
                    button_type: 'signup',
                    source: 'account_menu'
                });
                this.settingsDropdown.style.display = 'none';
                this.handleSignup();
            });
        }
        
        // Settings dropdown - Shortcuts
        if (this.shortcutsItem) {
            this.shortcutsItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Account Menu Help Clicked', {
                    button_type: 'help',
                    source: 'account_menu',
                    help_option: 'shortcuts'
                });
                this.settingsDropdown.style.display = 'none';
                this.showShortcutsModal();
            });
        }
        
        // Settings dropdown - Upgrade to Pro
        if (this.settingsUpgradeToProBtn) {
            this.settingsUpgradeToProBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.settingsDropdown.style.display = 'none';
                window.location.href = '/pricing';
            });
        }
        
        // Settings dropdown - Manage Subscription
        if (this.settingsManageSubscriptionBtn) {
            this.settingsManageSubscriptionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.settingsDropdown.style.display = 'none';
                this.handleManageSubscription();
            });
        }
        
        // Settings dropdown - Account
        if (this.settingsAccountBtn) {
            this.settingsAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Account Menu Account Clicked', {
                    button_type: 'account',
                    source: 'account_menu'
                });
                this.settingsDropdown.style.display = 'none';
                this.showSettingsModal();
            });
        }
        
        // Settings dropdown - Integrations (removed from menu, now only in Account)
        // if (this.settingsIntegrationsBtn) {
        //     this.settingsIntegrationsBtn.addEventListener('click', (e) => {
        //         e.preventDefault();
        //         this.settingsDropdown.style.display = 'none';
        //         this.showIntegrationsModal();
        //     });
        // }
        
        // Settings dropdown - Focus Report (Guest) - REMOVED
        // Guest users can now use the streak-info button directly
        // if (this.settingsStatisticsGuestBtn) {
        //     this.settingsStatisticsGuestBtn.addEventListener('click', (e) => {
        //         e.preventDefault();
        //         this.settingsDropdown.style.display = 'none';
        //         this.showGuestFocusReportTeaser();
        //     });
        // }
        
        // Settings dropdown - Feedback
        if (this.settingsFeedbackBtn) {
            this.settingsFeedbackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Account Menu Help Clicked', {
                    button_type: 'help',
                    source: 'account_menu',
                    help_option: 'feedback'
                });
                this.settingsDropdown.style.display = 'none';
                this.showFeedbackModal();
            });
        }
        
        // Settings dropdown - Help Toggle
        if (this.helpToggle) {
            this.helpToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.helpPanel) {
                    const isOpen = this.helpPanel.style.display === 'block';
                    this.helpPanel.style.display = isOpen ? 'none' : 'block';
                }
            });
        }
        
        // Close help panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.helpPanel && this.helpPanel.style.display === 'block') {
                if (!this.helpPanel.contains(e.target) && !this.helpToggle.contains(e.target)) {
                    this.helpPanel.style.display = 'none';
                }
            }
        });
        
        // Settings dropdown - Logout
        if (this.settingsLogoutBtn) {
            this.settingsLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.settingsDropdown.style.display = 'none';
                this.showLogoutModal();
            });
        }
        
        // Custom timer event listeners
        if (this.closeCustomTimer) this.closeCustomTimer.addEventListener('click', () => this.hideCustomTimerModal());
        if (this.cancelCustomTimer) this.cancelCustomTimer.addEventListener('click', () => this.hideCustomTimerModal());
        if (this.saveCustomTimer) this.saveCustomTimer.addEventListener('click', () => this.saveCustomTimerConfig());
        
        // Custom timer form inputs
        const customInputs = ['customName', 'focusTime', 'breakTime', 'longBreakTime', 'cycles'];
        customInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    // Optional: Add any real-time validation here
                });
            }
        });
        
        // Close dropdown when clicking outside (but ignore technique info modal)
        document.addEventListener('click', (e) => {
            // If click is inside the technique info modal, do nothing
            const inTechniqueInfo = e.target.closest && e.target.closest('.technique-info-overlay');
            if (inTechniqueInfo) return;

            if (this.techniqueDropdown && !this.techniqueDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Handle dropdown item selection
        this.dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't select technique if clicking on learn more link
                if (e.target.classList.contains('learn-more-link')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showTechniqueInfo(e.target.dataset.technique);
                    return;
                }

                // Don't select technique if clicking on login button
                if (e.target.classList.contains('login-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                const technique = item.getAttribute('data-technique');
                    this.showLoginRequiredModal(technique);
                    return;
                }

                const technique = item.getAttribute('data-technique');
                
                // Check if technique requires authentication
                const proTechniques = ['pomodoro-plus', 'ultradian-rhythm', 'custom'];
                if (proTechniques.includes(technique) && !this.isAuthenticated) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showLoginRequiredModal(technique);
                    return;
                }
                
                if (technique === 'custom') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleCustomTechniqueClick(item);
                    return;
                }
                this.selectTechnique(item);
            });
        });
        
        // Handle login buttons for advanced techniques
        this.setupLoginButtons();
        
        // Initialize dropdown items state after auth state is determined
        setTimeout(() => {
            this.initializeDropdownItemsState();
        }, 100);
        
        // Force update dropdown state after auth is fully determined
        setTimeout(() => {
            this.updateDropdownItemsState();
        }, 500);
        
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Improve scroll performance by pausing heavy animations while scrolling
        let scrollTimeoutId = null;
        window.addEventListener('scroll', () => {
            document.body.classList.add('is-scrolling');
            if (scrollTimeoutId) {
                clearTimeout(scrollTimeoutId);
            }
            scrollTimeoutId = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        }, { passive: true });
        
        // Handle login button
        if (this.loginButton) {
            this.loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Login Button Clicked', {
                    button_type: 'login',
                    source: 'main_header'
                });
                this.handleLogin();
            });
        }
        
        // Handle signup button
        if (this.signupButton) {
            this.signupButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Signup Button Clicked', {
                    button_type: 'signup',
                    source: 'main_header'
                });
                this.handleSignup();
            });
        }
        
        // Profile dropdown click behavior
        if (this.userProfileButton) {
            this.userProfileButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.userProfileDropdown) {
                    const isShown = this.userProfileDropdown.style.display === 'block';
                    this.userProfileDropdown.style.display = isShown ? 'none' : 'block';
                }
            });
        }

        // Achievement badge click - show focus stats in a simple way
        if (this.achievementIcon) {
            this.achievementIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSimpleFocusStats();
            });
        }

        // Logo click - redirect to home
        if (this.logoIcon) {
            this.logoIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Logo Clicked', {
                    button_type: 'logo',
                    destination: 'homepage'
                });
                window.location.href = 'https://superfocus.live';
            });
        }

        // Modal close buttons
        const closeUpgradeX = document.querySelector('.close-upgrade-x');
        if (closeUpgradeX) {
            closeUpgradeX.addEventListener('click', () => this.hideUpgradeModal());
        }

        const closeSettingsX = document.querySelector('.close-settings-x');
        if (closeSettingsX) {
            closeSettingsX.addEventListener('click', () => this.hideSettingsModal());
        }

        const closePricingX = document.querySelector('.close-pricing-x');
        if (closePricingX) {
            closePricingX.addEventListener('click', () => this.hidePricingModal());
        }

        // Close modals when clicking overlay
        const upgradeModal = document.getElementById('upgradeModal');
        if (upgradeModal) {
            upgradeModal.addEventListener('click', (e) => {
                if (e.target === upgradeModal) {
                    this.hideUpgradeModal();
                }
            });
        }

        const pricingModal = document.getElementById('pricingModal');
        if (pricingModal) {
            pricingModal.addEventListener('click', (e) => {
                if (e.target === pricingModal) {
                    this.hidePricingModal();
                }
            });
        }

        // Pricing modal buttons
        const upgradeToProFromPricing = document.getElementById('upgradeToProFromPricing');
        if (upgradeToProFromPricing) {
            upgradeToProFromPricing.addEventListener('click', async () => {
                this.hidePricingModal();
                await this.handleUpgrade();
            });
        }

        const signupFromPricing = document.getElementById('signupFromPricing');
        if (signupFromPricing) {
            signupFromPricing.addEventListener('click', () => {
                this.hidePricingModal();
                if (this.signupButton) {
                    this.signupButton.click();
                }
            });
        }

        // Settings modal tab navigation
        this.setupSettingsTabs();
        
        // View mode toggle buttons
        this.setupViewModeButtons();
        
        // Check if user is admin and show/hide Developer tab
        this.checkAdminAccess();

        // Upgrade button
        const upgradeBtn = document.querySelector('.upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', async () => {
                try {
                    let userId = '';
                    let userEmail = '';
                    try {
                        if (window.Clerk && window.Clerk.user) {
                            userId = window.Clerk.user.id || '';
                            userEmail = (window.Clerk.user.primaryEmailAddress?.emailAddress || window.Clerk.user.emailAddresses?.[0]?.emailAddress || '') + '';
                        }
                    } catch (_) {}

                    // If user is not logged in, show login prompt
                    if (!userId && !userEmail) {
                        alert('Please log in first to upgrade to Pro. Click "Sign up for free" or "Login" to continue.');
                        return;
                    }

                    const resp = await fetch('/api/create-checkout-session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-clerk-userid': userId,
                            'x-clerk-user-email': userEmail,
                        },
                    });

                    let data = null;
                    try {
                        data = await resp.json();
                    } catch (_) {
                        // non-JSON error
                    }

                    if (!resp.ok) {
                        const errMsg = (data && data.error) ? data.error : `HTTP ${resp.status}`;
                        console.error('Checkout session error response:', data);
                        throw new Error(errMsg);
                    }

                    const url = data && data.url;
                    if (url) {
                        window.location.assign(url);
                    } else {
                        throw new Error('No checkout url returned');
                    }
                } catch (err) {
                    console.error('Error creating checkout session:', err);
                    alert(`Error processing payment: ${err.message || err}`);
                }
            });
        }

        // Upgrade modal Cancel button
        const upgradeCancelBtn = document.getElementById('upgradeCancelBtn');
        if (upgradeCancelBtn) {
            upgradeCancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideUpgradeModal();
            });
        }

        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.hideSettingsModal();
                }
            });
        }
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (this.userProfileDropdown) this.userProfileDropdown.style.display = 'none';
            if (this.settingsDropdown) this.settingsDropdown.style.display = 'none';
            if (this.helpPanel) this.helpPanel.style.display = 'none';
        });
        
        // Logout action
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLogoutModal();
            });
        }

        // Reset focus stats (from settings modal)
        const settingsResetButton = document.getElementById('settingsResetButton');
        if (settingsResetButton) {
            settingsResetButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to reset all your focus data? This action cannot be undone.')) {
                    this.resetAllData();
                this.hideSettingsModal();
                }
            });
        }
        
        // Manage Account button (from settings modal)
        const manageAccountBtn = document.getElementById('manageAccountBtn');
        if (manageAccountBtn) {
            manageAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.Clerk && window.Clerk.user) {
                    window.Clerk.openUserProfile();
                }
            });
        }
        
        // Upgrade to Pro button (from settings modal)
        const upgradeToProModalBtn = document.getElementById('upgradeToProModalBtn');
        if (upgradeToProModalBtn) {
            upgradeToProModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideSettingsModal();
                window.location.href = '/pricing';
            });
        }
        
        // Manage Subscription button (from settings modal)
        const manageSubscriptionModalBtn = document.getElementById('manageSubscriptionModalBtn');
        if (manageSubscriptionModalBtn) {
            manageSubscriptionModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleManageSubscription();
            });
        }


        // Manage subscription button
        const manageSubscriptionButton = document.getElementById('manageSubscriptionButton');
        if (manageSubscriptionButton) {
            manageSubscriptionButton.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    let userEmail = '';
                    try {
                        if (window.Clerk && window.Clerk.user) {
                            userEmail = (window.Clerk.user.primaryEmailAddress?.emailAddress || window.Clerk.user.emailAddresses?.[0]?.emailAddress || '') + '';
                        }
                    } catch (_) {}
                    const response = await fetch('/api/customer-portal', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-clerk-userid': (window.Clerk && window.Clerk.user ? window.Clerk.user.id : ''),
                            'x-clerk-user-email': userEmail,
                            // Pass cached stripe customer id if Clerk has it
                            'x-stripe-customer-id': (window.Clerk && window.Clerk.user && window.Clerk.user.publicMetadata ? (window.Clerk.user.publicMetadata.stripeCustomerId || '') : ''),
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create customer portal session');
                    }

                    const { url } = await response.json();
                    window.location.href = url;
                } catch (error) {
                    console.error('Error creating customer portal session:', error);
                    alert('Error accessing subscription management. Please try again.');
                }
            });
        }

        // Mark as Premium button (for testing)
        const markPremiumButton = document.getElementById('markPremiumButton');
        if (markPremiumButton) {
            markPremiumButton.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('isPremium', 'true');
                localStorage.setItem('hasPaidSubscription', 'true');
                this.updatePremiumUI();
                alert('✅ Marked as Premium user!\n\nRefresh the page to see changes.');
            });
        }
        
        // Handle dropdown item clicks
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const text = item.querySelector('span').textContent;
                if (text === 'Log out') {
                    e.preventDefault();
                    this.showLogoutModal();
                    if (this.userProfileDropdown) this.userProfileDropdown.style.display = 'none';
                } else if (text === 'Upgrade to Pro') {
                    e.preventDefault();
                    this.showUpgradeModal();
                    if (this.userProfileDropdown) this.userProfileDropdown.style.display = 'none';
                } else if (text === 'Settings') {
                    e.preventDefault();
                    this.showSettingsModal();
                    if (this.userProfileDropdown) this.userProfileDropdown.style.display = 'none';
                } else if (text === 'Integrations') {
                    e.preventDefault();
                    this.showIntegrationsModal();
                    if (this.userProfileDropdown) this.userProfileDropdown.style.display = 'none';
                } else if (text === 'Feedback') {
                    e.preventDefault();
                    this.showFeedbackModal();
                    if (this.userProfileDropdown) this.userProfileDropdown.style.display = 'none';
                }
            });
        });
        
        // Logout modal actions
        if (this.confirmLogoutBtn) {
            this.confirmLogoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                this.hideLogoutModal();
                await this.performLogout();
            });
        } else {
            // Fallback: try to find the button again and bind the event
            const confirmBtn = document.getElementById('confirmLogoutBtn');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.hideLogoutModal();
                    await this.performLogout();
                });
            }
        }
        
        if (this.cancelLogoutBtn) {
            this.cancelLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLogoutModal();
            });
        }

        // Feedback modal actions
        const closeFeedbackModalX = document.getElementById('closeFeedbackModalX');
        const cancelFeedbackBtn = document.getElementById('cancelFeedbackBtn');
        const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
        
        if (closeFeedbackModalX) {
            closeFeedbackModalX.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideFeedbackModal();
            });
        }
        
        if (cancelFeedbackBtn) {
            cancelFeedbackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideFeedbackModal();
            });
        }
        if (submitFeedbackBtn) {
            submitFeedbackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitFeedback();
            });
        }

        // Guest task limit modal actions
        const closeGuestTaskLimitModalX = document.getElementById('closeGuestTaskLimitModalX');
        
        if (closeGuestTaskLimitModalX) {
            closeGuestTaskLimitModalX.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideGuestTaskLimitModal();
            });
        }
        
        if (this.guestTaskLimitSignupBtn) {
            this.guestTaskLimitSignupBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                this.trackEvent('Signup from Task Limit Modal', {
                    button_type: 'signup',
                    source: 'task_limit_modal',
                    user_type: this.isAuthenticated ? 'free_user' : 'guest',
                    task_count: this.getLocalTasks().length,
                    conversion_funnel: 'task_limit_reached'
                });
                
                this.hideGuestTaskLimitModal();
                
                if (!this.isAuthenticated) {
                    // Guest user - show signup
                    this.handleSignup();
                } else {
                    // Free user - redirect to Stripe checkout
                    try {
                        const response = await fetch('/api/create-checkout-session', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-clerk-userid': this.user?.id || ''
                            },
                        });
                        
                        if (response.ok) {
                            const { url } = await response.json();
                            window.location.href = url;
                        } else {
                            // Fallback to pricing page if Stripe fails
                            window.location.href = '/pricing';
                        }
                    } catch (error) {
                        console.error('Error creating checkout session:', error);
                        // Fallback to pricing page if error
                        window.location.href = '/pricing';
                    }
                }
            });
        }
        
        if (this.guestTaskLimitCancelBtn) {
            this.guestTaskLimitCancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('Learn More from Task Limit Modal', {
                    button_type: 'learn_more',
                    source: 'task_limit_modal',
                    user_type: this.isAuthenticated ? 'free_user' : 'guest'
                });
                this.hideGuestTaskLimitModal();
                window.location.href = '/pricing';
            });
        }
        
        // Close guest task limit modal when clicking overlay
        if (this.guestTaskLimitModalOverlay) {
            this.guestTaskLimitModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.guestTaskLimitModalOverlay) {
                    this.hideGuestTaskLimitModal();
                }
            });
        }
        
        
        
        // Close modal when clicking overlay
        if (this.logoutModalOverlay) {
            this.logoutModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.logoutModalOverlay) {
                    this.hideLogoutModal();
                }
            });
        }

        if (this.feedbackModalOverlay) {
            this.feedbackModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.feedbackModalOverlay) {
                    this.hideFeedbackModal();
                }
            });
        }
        
        // Integration Modal event listeners
        if (this.closeIntegrationModalX) {
            this.closeIntegrationModalX.addEventListener('click', () => {
                this.hideIntegrationModal();
            });
        }
        
        if (this.integrationModalOverlay) {
            this.integrationModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.integrationModalOverlay) {
                    this.hideIntegrationModal();
                }
            });
        }
        
        if (this.integrationModalPrimaryBtn) {
            this.integrationModalPrimaryBtn.addEventListener('click', async () => {
                this.trackEvent('Upgrade to Pro from Integration Modal', {
                    button_type: 'upgrade_to_pro',
                    source: 'integration_modal',
                    user_type: this.isAuthenticated ? 'free_user' : 'guest'
                });
                if (this.isAuthenticated) {
                    // Free user - redirect to Stripe checkout
                    try {
                        const response = await fetch('/api/create-checkout-session', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-clerk-userid': this.user?.id || ''
                            }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            window.location.href = data.url;
                        } else {
                            console.error('Checkout session creation failed:', response.status);
                            // Fallback to pricing page
                            window.location.href = '/pricing';
                        }
                    } catch (error) {
                        console.error('Error creating checkout session:', error);
                        // Fallback to pricing page
                        window.location.href = '/pricing';
                    }
                } else {
                    // Guest user - redirect to pricing
                    window.location.href = '/pricing';
                }
            });
        }
        
        if (this.integrationModalSecondaryBtn) {
            this.integrationModalSecondaryBtn.addEventListener('click', () => {
                if (this.isAuthenticated) {
                    // Free user - redirect to pricing
                    window.location.href = '/pricing';
                } else {
                    // Guest user - close modal
                    this.hideIntegrationModal();
                }
            });
        }
        
    }

    resetFocusStats() {
        try {
            localStorage.removeItem('focusStats');
        } catch (_) {}
        // Update UI immediately
        if (this.achievementCounter) {
            this.achievementCounter.textContent = '00h:00m';
        }
        // Reset cycle tracking for current cycle
        this.completedFocusSessionsInCycle = 0;
        this.cheatedDuringFocusInCycle = false;
        this.actualFocusTimeCompleted = 0;
        this.focusSecondsToday = 0;
        try {
            localStorage.setItem('focusSecondsToday', '0');
            localStorage.setItem('focusSecondsTodayDate', new Date().toDateString());
        } catch (_) {}
    }

    showUpgradeModal() {
        const pricingModal = document.getElementById('pricingModal');
        if (pricingModal) {
            pricingModal.style.display = 'flex';
            
            // 🎯 Track Modal Opened event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackModalOpened('pricing');
                console.log('📊 Pricing modal opened event tracked to Mixpanel');
            }
        }
    }
    
    hidePricingModal() {
        const pricingModal = document.getElementById('pricingModal');
        if (pricingModal) {
            pricingModal.style.display = 'none';
        }
    }

    async handleUpgrade() {
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Error processing payment. Please try again.');
        }
    }

    hideUpgradeModal() {
        const upgradeModal = document.getElementById('upgradeModal');
        if (upgradeModal) {
            upgradeModal.style.display = 'none';
        }
    }

    showSettingsModal() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'flex';
            
            // 🎯 Track Modal Opened event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackModalOpened('settings');
                console.log('📊 Settings modal opened event tracked to Mixpanel');
            }
            
            // Populate user info
            const emailElement = document.getElementById('settingsModalUserEmail');
            const planElement = document.getElementById('settingsUserPlan');
            const upgradeBtn = document.getElementById('upgradeToProModalBtn');
            const manageSubBtn = document.getElementById('manageSubscriptionModalBtn');
            
            if (emailElement && window.Clerk && window.Clerk.user) {
                const userEmail = window.Clerk.user.primaryEmailAddress?.emailAddress || 
                                window.Clerk.user.emailAddresses?.[0]?.emailAddress || 
                                'Not available';
                emailElement.textContent = userEmail;
            }
            
            if (planElement) {
                planElement.textContent = this.isPremium ? 'Pro' : 'Free';
            }
            
            // Show/hide buttons based on premium status
            if (upgradeBtn && manageSubBtn) {
                if (this.isPremium) {
                    upgradeBtn.style.display = 'none';
                    manageSubBtn.style.display = 'block';
                } else {
                    upgradeBtn.style.display = 'block';
                    manageSubBtn.style.display = 'none';
                }
            }
        }
    }

    showIntegrationsModal() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            // Switch to integrations tab and make it active
            this.switchToSettingsTab('integrations');
            // Make integrations nav item active
            const integrationsNav = document.querySelector('[data-tab="integrations"]');
            if (integrationsNav) {
                integrationsNav.classList.add('active');
            }
            settingsModal.style.display = 'flex';
        }
    }


    switchToSettingsTab(tabName) {
        // Hide all tabs
        const tabs = document.querySelectorAll('.settings-tab');
        tabs.forEach(tab => tab.style.display = 'none');
        
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Show the requested tab
        const targetTab = document.getElementById(`${tabName}-tab`);
        const targetNavItem = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab) targetTab.style.display = 'block';
        if (targetNavItem) targetNavItem.classList.add('active');
    }

    hideSettingsModal() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }

    // Sound system methods
    isPremiumUser() {
        // 1) Prefer real Pro from Clerk metadata regardless of any previous forced mode
        try {
            if (window.Clerk && window.Clerk.user) {
                const meta = window.Clerk.user.publicMetadata || {};
                console.log('Checking Pro status from Clerk:', {
                    isPremium: meta.isPremium,
                    metadata: meta,
                    userId: window.Clerk.user.id
                });
                if (meta.isPremium === true) return true;
            }
        } catch (_) {}

        // 2) Then check if a forced view mode exists (legacy/dev only)
        const forcedMode = localStorage.getItem('viewMode');
        if (forcedMode === 'pro') {
            console.log('Pro status from forced viewMode');
            return true;
        }
        if (forcedMode === 'free' || forcedMode === 'guest') return false;

        const urlParams = new URLSearchParams(window.location.search);
        const hasPremiumParam = urlParams.get('premium') === '1';
        const hasPremiumStorage = localStorage.getItem('isPremium') === 'true';
        const hasPaidSubscription = localStorage.getItem('hasPaidSubscription') === 'true';
        if (hasPremiumParam) {
            // Clear any forced mode to avoid overriding real Pro
            try { localStorage.removeItem('viewMode'); } catch (_) {}
            localStorage.setItem('isPremium', 'true');
            localStorage.setItem('hasPaidSubscription', 'true');
            return true;
        }
        
        const result = hasPremiumStorage || hasPaidSubscription;
        console.log('Pro status from localStorage:', {
            isPremium: hasPremiumStorage,
            hasPaidSubscription: hasPaidSubscription,
            result: result
        });
        return result;
    }

    // Simple ambient sounds system
    toggleMusic() {
        this.showAmbientModal();
    }
    
    showTimerSettingsModal() {
        // Get current durations in minutes
        const pomodoroMin = Math.floor(this.workTime / 60);
        const shortBreakMin = Math.floor(this.shortBreakTime / 60);
        const longBreakMin = Math.floor(this.longBreakTime / 60);
        
        const modalContent = `
            <div class="focus-stats-modal timer-settings-modal">
                <button class="close-focus-stats-x">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                </button>
                <div class="modal-header">
                    <h3>Timer Settings</h3>
                    <p class="modal-subtitle">Customize your focus sessions</p>
                </div>
                
                <!-- Sessions Count -->
                <div class="settings-section">
                    <h4 class="section-title">Sessions</h4>
                    <div class="sessions-control">
                        <div class="duration-item">
                            <div class="duration-header">
                                <label>Number of Sessions</label>
                                <span class="duration-value" id="sessionsValue">${this.sessionsPerCycle} sessions</span>
                            </div>
                            <input type="range" id="sessionsSlider" min="1" max="12" value="${this.sessionsPerCycle}" class="duration-slider">
                        </div>
                    </div>
                </div>

                <!-- Techniques -->
                <div class="settings-section">
                    <h4 class="section-title">Techniques</h4>
                    <div class="techniques-grid">
                        <button class="technique-preset" data-technique="pomodoro">
                            <div class="technique-icon">🍅</div>
                            <div class="technique-name">Pomodoro</div>
                            <div class="technique-desc">25min work, 5min break</div>
                        </button>
                        <button class="technique-preset" data-technique="flow">
                            <div class="technique-icon">🌊</div>
                            <div class="technique-name">Flow State</div>
                            <div class="technique-desc">45min work, 15min break</div>
                        </button>
                        <button class="technique-preset" data-technique="deepwork">
                            <div class="technique-icon">🧠</div>
                            <div class="technique-name">Deep Work</div>
                            <div class="technique-desc">90min work, 20min break</div>
                        </button>
                        <button class="technique-preset" data-technique="sprint">
                            <div class="technique-icon">⚡</div>
                            <div class="technique-name">Sprint</div>
                            <div class="technique-desc">15min work, 3min break</div>
                        </button>
                        <button class="technique-preset" data-technique="marathon">
                            <div class="technique-icon">🏃</div>
                            <div class="technique-name">Marathon</div>
                            <div class="technique-desc">60min work, 10min break</div>
                        </button>
                    </div>
                </div>

                <!-- Timer Durations -->
                <div class="settings-section">
                    <h4 class="section-title">Duration</h4>
                    <div class="duration-controls">
                        <div class="duration-item">
                            <div class="duration-header">
                                <label>Pomodoro</label>
                                <span class="duration-value" id="pomodoroValue">${pomodoroMin} min</span>
                            </div>
                            <input type="range" id="pomodoroSlider" min="1" max="90" value="${pomodoroMin}" class="duration-slider">
                        </div>
                        <div class="duration-item">
                            <div class="duration-header">
                                <label>Short Break</label>
                                <span class="duration-value" id="shortBreakValue">${shortBreakMin} min</span>
                            </div>
                            <input type="range" id="shortBreakSlider" min="1" max="30" value="${shortBreakMin}" class="duration-slider">
                        </div>
                        <div class="duration-item">
                            <div class="duration-header">
                                <label>Long Break</label>
                                <span class="duration-value" id="longBreakValue">${longBreakMin} min</span>
                            </div>
                            <input type="range" id="longBreakSlider" min="1" max="60" value="${longBreakMin}" class="duration-slider">
                        </div>
                    </div>
                </div>
                
                <!-- Save Button -->
                <div class="modal-actions">
                    <button class="save-settings-btn" id="saveTimerSettings">Save Changes</button>
                </div>
            </div>
        `;
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'focus-stats-overlay';
        modalOverlay.innerHTML = modalContent;
        document.body.appendChild(modalOverlay);
        modalOverlay.style.display = 'flex';
        
        // Duration sliders
        const pomodoroSlider = modalOverlay.querySelector('#pomodoroSlider');
        const shortBreakSlider = modalOverlay.querySelector('#shortBreakSlider');
        const longBreakSlider = modalOverlay.querySelector('#longBreakSlider');
        const pomodoroValue = modalOverlay.querySelector('#pomodoroValue');
        const shortBreakValue = modalOverlay.querySelector('#shortBreakValue');
        const longBreakValue = modalOverlay.querySelector('#longBreakValue');
        
        pomodoroSlider.addEventListener('input', (e) => {
            this.trackEvent('Duration Control Changed', {
                button_type: 'duration_control',
                control_name: 'pomodoro',
                value: e.target.value,
                source: 'timer_modal'
            });
            pomodoroValue.textContent = `${e.target.value} min`;
        });
        shortBreakSlider.addEventListener('input', (e) => {
            this.trackEvent('Duration Control Changed', {
                button_type: 'duration_control',
                control_name: 'short_break',
                value: e.target.value,
                source: 'timer_modal'
            });
            shortBreakValue.textContent = `${e.target.value} min`;
        });
        longBreakSlider.addEventListener('input', (e) => {
            this.trackEvent('Duration Control Changed', {
                button_type: 'duration_control',
                control_name: 'long_break',
                value: e.target.value,
                source: 'timer_modal'
            });
            longBreakValue.textContent = `${e.target.value} min`;
        });
        
        // Sessions slider
        const sessionsSlider = modalOverlay.querySelector('#sessionsSlider');
        const sessionsValue = modalOverlay.querySelector('#sessionsValue');
        sessionsSlider.addEventListener('input', (e) => {
            this.trackEvent('Duration Control Changed', {
                button_type: 'duration_control',
                control_name: 'sessions',
                value: e.target.value,
                source: 'timer_modal'
            });
            sessionsValue.textContent = `${e.target.value} sessions`;
        });

        // Techniques presets
        const techniquePresets = modalOverlay.querySelectorAll('.technique-preset');
        techniquePresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const technique = preset.dataset.technique;
                this.trackEvent('Technique Selected', {
                    button_type: 'technique_preset',
                    technique_name: technique,
                    source: 'timer_modal',
                    user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                    conversion_funnel: 'technique_exploration'
                });
                // Remove active class from all presets
                techniquePresets.forEach(p => p.classList.remove('active'));
                // Add active class to clicked preset
                preset.classList.add('active');
                
                // Apply technique settings
                this.applyTechniquePreset(technique, pomodoroSlider, shortBreakSlider, longBreakSlider, sessionsSlider);
            });
        });

        // Close button
        modalOverlay.querySelector('.close-focus-stats-x').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Save button
        modalOverlay.querySelector('#saveTimerSettings').addEventListener('click', () => {
            // Save new durations
            this.workTime = parseInt(pomodoroSlider.value) * 60;
            this.shortBreakTime = parseInt(shortBreakSlider.value) * 60;
            this.longBreakTime = parseInt(longBreakSlider.value) * 60;
            this.sessionsPerCycle = parseInt(sessionsSlider.value);
            
            // Save to localStorage
            localStorage.setItem('pomodoroTime', String(this.workTime));
            localStorage.setItem('shortBreakTime', String(this.shortBreakTime));
            localStorage.setItem('longBreakTime', String(this.longBreakTime));
            localStorage.setItem('sessionsPerCycle', String(this.sessionsPerCycle));
            
            // Update cycle sections
            this.cycleSections = [
                { type: 'work', duration: this.workTime, name: 'Work 1' },
                { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                { type: 'work', duration: this.workTime, name: 'Work 2' },
                { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                { type: 'work', duration: this.workTime, name: 'Work 3' },
                { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                { type: 'work', duration: this.workTime, name: 'Work 4' },
                { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
            ];
            
            // Reset timer to first section
            this.pauseTimerSilent();
            this.currentSection = 1;
            this.loadCurrentSection();
            this.updateProgressRing();
            
            // Close modal
            document.body.removeChild(modalOverlay);
        });
    }

    applyTechniquePreset(technique, pomodoroSlider, shortBreakSlider, longBreakSlider, sessionsSlider) {
        
        const presets = {
            pomodoro: { work: 25, shortBreak: 5, longBreak: 15, sessions: 4 },
            flow: { work: 45, shortBreak: 15, longBreak: 30, sessions: 3 },
            deepwork: { work: 90, shortBreak: 20, longBreak: 45, sessions: 2 },
            sprint: { work: 15, shortBreak: 3, longBreak: 10, sessions: 6 },
            marathon: { work: 60, shortBreak: 10, longBreak: 20, sessions: 4 }
        };

        const preset = presets[technique];
        if (preset) {
            pomodoroSlider.value = preset.work;
            shortBreakSlider.value = preset.shortBreak;
            longBreakSlider.value = preset.longBreak;
            sessionsSlider.value = preset.sessions;

            // Update display values
            document.querySelector('#pomodoroValue').textContent = `${preset.work} min`;
            document.querySelector('#shortBreakValue').textContent = `${preset.shortBreak} min`;
            document.querySelector('#longBreakValue').textContent = `${preset.longBreak} min`;
            document.querySelector('#sessionsValue').textContent = `${preset.sessions} sessions`;
        }
    }

    applySidebarTechniquePreset(technique, pomodoroSlider, shortBreakSlider, longBreakSlider, sessionsSlider) {
        const presets = {
            pomodoro: { work: 25, shortBreak: 5, longBreak: 15, sessions: 4 },
            flow: { work: 45, shortBreak: 15, longBreak: 30, sessions: 3 },
            deepwork: { work: 90, shortBreak: 20, longBreak: 45, sessions: 2 },
            sprint: { work: 15, shortBreak: 3, longBreak: 10, sessions: 6 },
            marathon: { work: 60, shortBreak: 10, longBreak: 20, sessions: 4 },
            focus: { work: 30, shortBreak: 8, longBreak: 20, sessions: 4 }
        };

        const preset = presets[technique];
        if (preset) {
            pomodoroSlider.value = preset.work;
            shortBreakSlider.value = preset.shortBreak;
            longBreakSlider.value = preset.longBreak;
            sessionsSlider.value = preset.sessions;

            // Update display values
            document.querySelector('#sidebarPomodoroValue').textContent = `${preset.work} min`;
            document.querySelector('#sidebarShortBreakValue').textContent = `${preset.shortBreak} min`;
            document.querySelector('#sidebarLongBreakValue').textContent = `${preset.longBreak} min`;
            document.querySelector('#sidebarSessionsValue').textContent = `${preset.sessions} sesh`;
        }
    }

    showAmbientLoginModal() {
        const modalContent = `
            <div class="focus-stats-modal">
                <button class="close-focus-stats-x">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                    </svg>
                </button>
                <div class="login-required-content">
                    <div class="login-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music-icon lucide-music">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                        </svg>
                    </div>
                    <h3>Ambient Sounds</h3>
                    <p>Create a free account to access ambient sounds and enhance your focus sessions.</p>
                    <div class="login-required-buttons">
                        <button class="login-btn" id="ambientLoginBtn">Login</button>
                        <button class="cancel-btn" id="ambientCancelBtn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'focus-stats-overlay';
        modalOverlay.innerHTML = modalContent;
        document.body.appendChild(modalOverlay);
        modalOverlay.style.display = 'flex';

		// Hard-remove any Spotify-related UI from the Background Music modal (defensive)
		(() => {
			const selectors = [
				'#spotifyPlaylistsList',
				'.spotify-actions',
				'#connectSpotifyBtn',
				'#disconnectSpotifyBtn',
				'#spotifyToggle',
				'#spotifyPlaylists'
			];
			selectors.forEach((sel) => {
				const el = modalOverlay.querySelector(sel);
				if (!el) return;
				const container = el.closest('.music-section') || el.closest('.music-controls > *') || el.parentElement;
				if (container && container.parentElement) {
					container.parentElement.removeChild(container);
				} else {
					el.remove();
				}
			});

			// Remove any headings/text blocks that mention Spotify/Playlists
			Array.from(modalOverlay.querySelectorAll('h4, p, div, span')).forEach((node) => {
				try {
					const text = (node.textContent || '').trim();
					if (!text) return;
					if (/spotify/i.test(text) || /playlists/i.test(text)) {
						const container = node.closest('.music-section') || node.closest('.music-controls > *') || node.parentElement;
						if (container && container.parentElement && container !== modalOverlay) {
							container.parentElement.removeChild(container);
						} else {
							node.remove();
						}
					}
				} catch (_) {}
			});

			// Also remove any Preview control if present
			const previewBtnInDom = modalOverlay.querySelector('#previewBtn');
			if (previewBtnInDom && previewBtnInDom.parentElement) {
				previewBtnInDom.parentElement.removeChild(previewBtnInDom);
			}
		})();

		// Remove Spotify UI and Preview button from the modal UI
		const spotifyListSection = modalOverlay.querySelector('#spotifyPlaylistsList');
		if (spotifyListSection) {
			const spotifySectionContainer = spotifyListSection.closest('.music-section') || spotifyListSection.parentElement;
			if (spotifySectionContainer && spotifySectionContainer.parentElement) {
				spotifySectionContainer.parentElement.removeChild(spotifySectionContainer);
			}
		}
		const spotifyActions = modalOverlay.querySelector('.spotify-actions');
		if (spotifyActions && spotifyActions.parentElement) {
			spotifyActions.parentElement.removeChild(spotifyActions);
		}
		const previewBtnInDom = modalOverlay.querySelector('#previewBtn');
		if (previewBtnInDom && previewBtnInDom.parentElement) {
			previewBtnInDom.parentElement.removeChild(previewBtnInDom);
		}

        // Event listeners
        modalOverlay.querySelector('.close-focus-stats-x').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        modalOverlay.querySelector('#ambientLoginBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            window.location.href = 'https://accounts.superfocus.live/sign-in?redirect_url=' + encodeURIComponent(window.location.href);
        });

        modalOverlay.querySelector('#ambientCancelBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }
    
    showShortcutsModal() {
        const modalContent = `
            <div class="focus-stats-modal timer-settings-modal">
                <button class="close-focus-stats-x">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                </button>
                <div class="modal-header">
                    <h3>Keyboard Shortcuts</h3>
                    <p class="modal-subtitle">Quick actions to boost your productivity</p>
                </div>
                
                <div class="settings-section">
                    <div class="shortcuts-list">
                        <div class="shortcut-item">
                            <span class="shortcut-description">Start/Pause Timer</span>
                            <kbd class="shortcut-key">Space</kbd>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-description">Reset Timer</span>
                            <kbd class="shortcut-key">R</kbd>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-description">Next Section</span>
                            <kbd class="shortcut-key">→</kbd>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-description">Previous Section</span>
                            <kbd class="shortcut-key">←</kbd>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-description">Open Shortcuts</span>
                            <kbd class="shortcut-key">⌘K</kbd>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'focus-stats-overlay';
        modalOverlay.innerHTML = modalContent;
        document.body.appendChild(modalOverlay);
        modalOverlay.style.display = 'flex';
        
        // Close button
        const closeBtn = modalOverlay.querySelector('.close-focus-stats-x');
        closeBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            if (modalOverlay.parentNode) {
                document.body.removeChild(modalOverlay);
            }
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
                if (modalOverlay.parentNode) {
                    document.body.removeChild(modalOverlay);
                }
            }
        });
    }

    showAmbientModal() {
        const initialVolumePct = Math.round(this.ambientVolume * 100);
        const lofiEnabled = this.ambientEnabled;
        const rainEnabled = this.rainEnabled;
        const modalContent = `
            <div class="focus-stats-modal background-music-modal">
                <button class="close-focus-stats-x">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                    </svg>
                </button>
                <div class="modal-header">
                    <h3>Focus Sounds - UPDATED</h3>
                    <p class="modal-subtitle">Set the mood for deep concentration</p>
                </div>
                <div class="music-controls">
                    <div class="volume-section">
                        <div class="volume-header">
                            <label class="volume-label">Volume</label>
                            <span class="volume-value" id="ambientVolumeValue">${initialVolumePct}%</span>
                                </div>
                        <div class="volume-control">
                            <input type="range" id="ambientVolume" min="0" max="100" value="${initialVolumePct}" class="volume-slider">
                        </div>
                    </div>
                    <div class="music-section">
                        <div class="music-header">
                            <div class="music-info">
                                <div class="music-details">
                                    <h4>Rain Sounds</h4>
                                    <p>Natural rain and thunder for deep concentration</p>
                                </div>
                            </div>
                            <div class="toggle-container">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="musicRainToggle" ${rainEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        ${this.isAuthenticated ? `
                        <div class="music-header">
                            <div class="music-info">
                                <div class="music-details">
                                    <h4>Lofi Music</h4>
                                    <p>Relaxing beats for deep focus</p>
                                </div>
                            </div>
                            <div class="toggle-container">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="musicLofiToggle" ${lofiEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        ` : `
                        <div class="music-header disabled">
                            <div class="music-info">
                                <div class="music-details">
                                    <h4 style="color: #666;">Lofi Music</h4>
                                    <p style="color: #888;">Relaxing beats for deep focus</p>
                                </div>
                            </div>
                            <div class="login-container">
                                <button id="lofiLoginBtn" class="login-btn">Sign up</button>
                            </div>
                        </div>
                        `}
                            </div>
                </div>
            </div>
        `;

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'focus-stats-overlay';
        modalOverlay.innerHTML = modalContent;
        document.body.appendChild(modalOverlay);
        modalOverlay.style.display = 'flex';

        // Event listeners
        modalOverlay.querySelector('.close-focus-stats-x').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        const volumeSlider = modalOverlay.querySelector('#ambientVolume');
        const volumeValue = modalOverlay.querySelector('#ambientVolumeValue');
        const musicLofiToggle = modalOverlay.querySelector('#musicLofiToggle');
        const musicRainToggle = modalOverlay.querySelector('#musicRainToggle');
        const previewBtn = modalOverlay.querySelector('#previewBtn');
        const lofiLoginBtn = modalOverlay.querySelector('#lofiLoginBtn');
        
        // Initialize controls with current state (volume applies to active source)
        volumeSlider.disabled = !(lofiEnabled || rainEnabled);
        // The same slider controls the single <audio> element, regardless of source
		if (previewBtn) previewBtn.disabled = !lofiEnabled;
        
        // Initialize toggle states based on current settings
        if (musicLofiToggle) musicLofiToggle.checked = lofiEnabled;
        if (musicRainToggle) musicRainToggle.checked = rainEnabled;

        // Lofi toggle logic
        if (musicLofiToggle) {
            musicLofiToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.ambientEnabled = enabled;
                localStorage.setItem('ambientEnabled', String(enabled));
                volumeSlider.disabled = !(this.ambientEnabled || this.rainEnabled);
                if (previewBtn) previewBtn.disabled = !enabled;
                
                if (enabled) {
                    // If enabling lofi, disable rain
                    this.rainEnabled = false;
                    localStorage.setItem('rainEnabled', 'false');
                    if (musicRainToggle) musicRainToggle.checked = false;
                    this.stopRainPlaylist();
                    
                    // Start lofi music if timer is running
                    if (this.isRunning) {
                        this.playPlaylist();
                    }
                } else {
                    this.stopPlaylist();
                }
            });
        }


        // Lofi Login button and card (for guests)
        if (lofiLoginBtn) {
            // Make the entire disabled card clickable
            const disabledLofiCard = modalOverlay.querySelector('.music-header.disabled');
            if (disabledLofiCard) {
                disabledLofiCard.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    document.body.removeChild(modalOverlay);
                    this.showLofiLoginModal();
                });
            }
            
            // Keep button click handler for backwards compatibility
            lofiLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.body.removeChild(modalOverlay);
                this.showLofiLoginModal();
            });
        }

        // Rain toggle logic
        if (musicRainToggle) {
            musicRainToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.rainEnabled = enabled;
                localStorage.setItem('rainEnabled', String(enabled));
                volumeSlider.disabled = !(this.ambientEnabled || this.rainEnabled);
                if (previewBtn) previewBtn.disabled = true;
                
                if (enabled) {
                    // If enabling rain, disable lofi
                    this.ambientEnabled = false;
                    localStorage.setItem('ambientEnabled', 'false');
                    if (musicLofiToggle) musicLofiToggle.checked = false;
                    this.stopPlaylist();
                    
                    // Start Rain music if timer is running
                    if (this.isRunning) {
                        this.playRainPlaylist();
                    }
                } else {
                    this.stopRainPlaylist();
                }
            });
        }

        // Preview button (play/pause functionality)
		if (previewBtn) {
        previewBtn.addEventListener('click', async () => {
            if (lofiToggle.checked) {
                if (previewBtn.textContent === 'Preview') {
                    await this.playPlaylist();
                    previewBtn.textContent = 'Pause';
                } else {
                    this.stopPlaylist();
                    previewBtn.textContent = 'Preview';
                }
            }
        });
		}

        volumeSlider.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value + '%';
            this.setAmbientVolume(e.target.value / 100);
        });


        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }

    // Helper to set playlist after uploading files
    setPlaylist(trackFilenames = []) {
        if (!Array.isArray(trackFilenames)) return;
        // Keep only .mp3 and .wav for safety
        this.playlist = trackFilenames.filter(name => /\.(mp3|wav)$/i.test(name));
        this.currentTrackIndex = 0;
    }

    async playPlaylist() {
        if (!this.backgroundAudio) return;
        if (!this.playlist || this.playlist.length === 0) {
            alert('No background tracks available yet. Upload MP3s to /audio/lofi');
            return;
        }
        // If switching from Bury the Light, ensure src actually changes to lofi
        this.backgroundAudio.pause();
        this.backgroundAudio.src = '/audio/lofi/' + this.playlist[this.currentTrackIndex];
        this.backgroundAudio.loop = false;
        this.backgroundAudio.volume = this.ambientVolume;
        try { await this.backgroundAudio.play(); } catch (_) {}
        this.ambientPlaying = true;
        this.buryTheLightPlaying = false; // Ensure only one flag is set
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }

    stopPlaylist() {
        if (!this.backgroundAudio) return;
        try { this.backgroundAudio.pause(); } catch (_) {}
        this.ambientPlaying = false;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.remove('playing');
    }

    // Lofi music methods
    setLofiVolume(vol) {
        this.lofiVolume = Math.max(0, Math.min(1, vol));
        localStorage.setItem('lofiVolume', String(this.lofiVolume));
        if (this.backgroundAudio) this.backgroundAudio.volume = this.lofiVolume;
    }

    shuffleLofiPlaylist() {
        // Fisher-Yates shuffle algorithm for random order
        this.lofiShuffledPlaylist = [...this.lofiPlaylist];
        for (let i = this.lofiShuffledPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.lofiShuffledPlaylist[i], this.lofiShuffledPlaylist[j]] = [this.lofiShuffledPlaylist[j], this.lofiShuffledPlaylist[i]];
        }
        this.currentLofiTrackIndex = 0;
    }

    async playLofiPlaylist() {
        // Don't play Lofi music if immersive theme is active
        if (this.currentImmersiveTheme && this.currentImmersiveTheme !== 'none') {
            console.log(`🎵 Lofi music blocked - immersive theme '${this.currentImmersiveTheme}' is active`);
            return;
        }
        
        // Don't play if lofi is disabled
        if (!this.lofiEnabled) {
            console.log(`🎵 Lofi music blocked - lofi disabled`);
            return;
        }
        
        if (!this.backgroundAudio) return;
        if (!this.lofiShuffledPlaylist || this.lofiShuffledPlaylist.length === 0) {
            console.log('❌ No Lofi tracks available yet');
            return;
        }
        
        this.backgroundAudio.pause();
        this.backgroundAudio.src = '/audio/Lofi/' + this.lofiShuffledPlaylist[this.currentLofiTrackIndex];
        this.backgroundAudio.loop = false;
        this.backgroundAudio.volume = this.lofiVolume;
        
        try { 
            await this.backgroundAudio.play(); 
            console.log('✅ Lofi music started:', this.lofiShuffledPlaylist[this.currentLofiTrackIndex]);
        } catch (error) {
            console.log('❌ Error playing Lofi:', error);
        }
        
        this.lofiPlaying = true;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }


    stopLofiPlaylist() {
        if (!this.backgroundAudio) return;
        try { this.backgroundAudio.pause(); } catch (_) {}
        this.lofiPlaying = false;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.remove('playing');
    }

    pauseLofiPlaylist() {
        if (!this.backgroundAudio) return;
        try { this.backgroundAudio.pause(); } catch (_) {}
        this.lofiPlaying = false;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.remove('playing');
    }

    resumeLofiPlaylist() {
        if (!this.backgroundAudio) return;
        if (!this.lofiEnabled) return;
        
        const src = this.backgroundAudio.currentSrc || this.backgroundAudio.src || '';
        const isLofiSrc = /\/audio\/Lofi\//.test(src);
        
        if (!isLofiSrc && this.lofiShuffledPlaylist.length > 0) {
            this.backgroundAudio.src = '/audio/Lofi/' + this.lofiShuffledPlaylist[this.currentLofiTrackIndex];
        }
        
        try { this.backgroundAudio.play(); } catch (_) {}
        this.lofiPlaying = true;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }

    nextLofiTrack() {
        if (!this.lofiShuffledPlaylist || this.lofiShuffledPlaylist.length === 0 || !this.backgroundAudio) return;
        
        this.currentLofiTrackIndex = (this.currentLofiTrackIndex + 1) % this.lofiShuffledPlaylist.length;
        
        // Re-shuffle when playlist loops back to beginning
        if (this.currentLofiTrackIndex === 0) {
            this.shuffleLofiPlaylist();
        }
        
        this.backgroundAudio.src = '/audio/Lofi/' + this.lofiShuffledPlaylist[this.currentLofiTrackIndex];
        this.backgroundAudio.volume = this.lofiVolume;
        this.backgroundAudio.play().catch(() => {});
        this.lofiPlaying = true;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }

    async loadLofiPlaylist() {
        try {
            // Lofi playlist - 27 relaxing tracks
            this.lofiPlaylist = [
                "A Sip of Yesterday.mp3",
                "Autumn Reverie.mp3",
                "Autumn's Whisper.mp3",
                "Dream in Slow Motion.mp3",
                "Dreaming in Dandelions.mp3",
                "Dreaming in Pastels.mp3",
                "Dreams in Sepia.mp3",
                "Dreams in the Windowlight.mp3",
                "Driftwood Dreams.mp3",
                "Evening in a Teacup.mp3",
                "Evening's Gentle Glow.mp3",
                "Falling for Yesterday.mp3",
                "Golden Glow.mp3",
                "Golden Hour Glow.mp3",
                "Golden Hour Memory.mp3",
                "Lantern Glow.mp3",
                "Lost in the Glow.mp3",
                "Lost in the Quiet.mp3",
                "Moonlight Whispers.mp3",
                "Starlit Whispers.mp3",
                "Under the Velvet Sky.mp3",
                "Whispered Breezes.mp3",
                "Whispered Dreams.mp3",
                "Whispered Horizons.mp3",
                "Whispered Memories.mp3",
                "Whispered Pines.mp3",
                "Whispering Lights.mp3"
            ];
            
            console.log(`📂 Loaded ${this.lofiPlaylist.length} Lofi tracks`);
            
            // Shuffle the playlist for first playback
            if (this.lofiPlaylist.length > 0) {
                this.shuffleLofiPlaylist();
            }
        } catch (error) {
            console.error('❌ Error loading Lofi playlist:', error);
        }
    }

    // Smooth fades
    fadeMusicTo(targetVolume, durationMs) {
        if (!this.backgroundAudio) return;
        // Only fade if music is actually playing
        if (!this.lofiPlaying) return;
        
        if (this.fadeTimer) {
            clearInterval(this.fadeTimer);
            this.fadeTimer = null;
        }
        const start = this.backgroundAudio.volume;
        const delta = targetVolume - start;
        const steps = Math.max(1, Math.floor(durationMs / 50));
        let count = 0;
        this.fadeTimer = setInterval(() => {
            count++;
            const t = count / steps;
            const v = start + delta * t;
            this.backgroundAudio.volume = Math.max(0, Math.min(1, v));
            if (count >= steps) {
                clearInterval(this.fadeTimer);
                this.fadeTimer = null;
                this.backgroundAudio.volume = Math.max(0, Math.min(1, targetVolume));
            }
        }, 50);
    }

    fadeMusicIn(durationMs) {
        if (!this.backgroundAudio) return;
        // Only fade in if music is actually playing
        if (!this.lofiPlaying) return;
        
        const target = this.lofiVolume;
        if (this.backgroundAudio.volume > 0.001) this.backgroundAudio.volume = 0;
        this.fadeMusicTo(target, durationMs);
    }

    fadeMusicOut(durationMs) {
        if (!this.backgroundAudio) return;
        // Only fade out if music is actually playing
        if (!this.lofiPlaying) return;
        
        this.fadeMusicTo(0, durationMs);
    }

    updatePremiumUI() {
        const upgradeButton = document.getElementById('upgradeToProButton');
        const manageSubscriptionButton = document.getElementById('manageSubscriptionButton');
        const userProBadge = document.getElementById('userProBadge');
        const integrationsButton = document.getElementById('integrationsButton');
        const integrationsSection = document.getElementById('integrationsSection');
        
        if (this.isPremiumUser()) {
            // Show Manage subscription, hide Upgrade, show Pro badge, show Integrations
            if (upgradeButton) upgradeButton.style.display = 'none';
            if (manageSubscriptionButton) manageSubscriptionButton.style.display = 'flex';
            if (userProBadge) userProBadge.style.display = 'inline-block';
            if (integrationsButton) integrationsButton.style.display = 'flex';
            if (integrationsSection) integrationsSection.style.display = 'block';
            
            // Settings dropdown elements
            if (this.settingsUpgradeToProBtn) this.settingsUpgradeToProBtn.style.display = 'none';
            if (this.settingsManageSubscriptionBtn) this.settingsManageSubscriptionBtn.style.display = 'flex';
            if (this.settingsProBadge) this.settingsProBadge.style.display = 'inline-block';
            // Integrations removed from menu
            // if (this.settingsIntegrationsBtn) this.settingsIntegrationsBtn.style.display = 'flex';
        } else {
            // Show Upgrade, hide Manage subscription, hide Pro badge
            if (upgradeButton) upgradeButton.style.display = 'flex';
            if (manageSubscriptionButton) manageSubscriptionButton.style.display = 'none';
            if (userProBadge) userProBadge.style.display = 'none';
            if (integrationsButton) integrationsButton.style.display = 'none';
            if (integrationsSection) integrationsSection.style.display = 'none';
            
            // Settings dropdown elements
            if (this.settingsUpgradeToProBtn) this.settingsUpgradeToProBtn.style.display = 'flex';
            if (this.settingsManageSubscriptionBtn) this.settingsManageSubscriptionBtn.style.display = 'none';
            if (this.settingsProBadge) this.settingsProBadge.style.display = 'none';
            // Integrations removed from menu
            // if (this.settingsIntegrationsBtn) this.settingsIntegrationsBtn.style.display = 'none';
        }
    }

    async refreshPremiumFromServer() {
        try {
            if (!window.Clerk || !window.Clerk.user) return;
            const userId = window.Clerk.user.id;
            const userEmail = (window.Clerk.user.primaryEmailAddress?.emailAddress || window.Clerk.user.emailAddresses?.[0]?.emailAddress || '') + '';
            const resp = await fetch('/api/refresh-premium', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-clerk-userid': userId,
                    'x-clerk-user-email': userEmail,
                },
            });
            if (!resp.ok) return;
            const data = await resp.json();
            // Actualiza UI si cambió
            this.updatePremiumUI();
            return data;
        } catch (_) {
            // silencioso
        }
    }


    toggleTaskList() {
        // 🎯 Track Sidebar Panel Opened event to Mixpanel
        if (window.mixpanelTracker) {
            window.mixpanelTracker.trackSidebarPanelOpened('tasks');
            console.log('📊 Tasks panel opened event tracked to Mixpanel');
        }
        
        // Check user type and subscription level
        if (!this.isAuthenticated || !this.user) {
            // Guest users: show local tasks only
            this.clearTodoistTasks();
        this.showTaskListModal();
        } else if (this.user && !this.isPro) {
            // Free users: show local tasks only
            this.clearTodoistTasks();
            this.showTaskListModal();
        } else if (this.user && this.isPro) {
            // Pro users: show Todoist integration modal
            this.showTodoistModal();
        }
        // Don't toggle active state - keep button in normal state
    }

    // Clear Todoist tasks and related data
    clearTodoistTasks() {
        this.todoistTasks = [];
        this.todoistProjectsById = {};
        // Keep local task configurations (sessions, selection) intact
        // Clear current task banner if it exists
        this.updateCurrentTaskBanner();
    }

    handleCustomTechniqueClick(item) {
        // Check if user has a saved custom timer
        const savedCustomTimer = localStorage.getItem('customTimer');
        
        if (savedCustomTimer) {
            // User has a custom timer - select it normally
            this.selectTechnique(item);
        } else {
            // User doesn't have a custom timer - show the modal to create one
            this.showCustomTimerModal();
        }
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    resetTimer() {
        // Pause timer if running
        if (this.isRunning) {
            this.pauseTimer();
        }
        
        // Reset to first section
        this.currentSection = 1;
        
        // Reload the current section (now section 1)
        this.loadCurrentSection();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update session info display
        this.updateSessionInfo();
        
        // Update progress ring
        this.updateProgressRing();
        
        // Clear saved timer state
        this.clearTimerState();
        
        // Play UI sound for feedback
        this.playUiSound('click');
    }
    
    startTimer() {
        // Check if Tron theme is active and widget is not ready
        // Widget is visible and ready, no checks needed
        
        this.isRunning = true;
        this.startPauseBtn.classList.add('running');
        this.playUiSound('play');
        
        // Show keyboard shortcut hint on first play
        this.showKeyboardHint();
        
        // 🎯 Track Timer Started event to Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timer_started', {
                event_category: 'engagement',
                event_label: 'User started focus timer',
                value: 1
            });
            
            console.log('📊 Timer started event tracked to Analytics');
        }
        
        // 🎯 Track Timer Started event to Mixpanel
        if (window.mixpanelTracker) {
            const currentSectionInfo = this.cycleSections[this.currentSection - 1];
            const sessionType = currentSectionInfo.type === 'work' ? 'work' : 
                               currentSectionInfo.type === 'long-break' ? 'long_break' : 'short_break';
            
            window.mixpanelTracker.trackTimerStart(
                sessionType, 
                currentSectionInfo.duration, 
                this.currentTaskName
            );
            
            console.log('📊 Timer started event tracked to Mixpanel');
        }
        
        // Close all open modals to focus on timer
        this.closeAllModals();
        
        // Resume background music if enabled
        if (this.lofiEnabled) {
            const hasProgress = this.backgroundAudio && !isNaN(this.backgroundAudio.currentTime) && this.backgroundAudio.currentTime > 0;
            if (hasProgress && /\/audio\/Lofi\//.test(this.backgroundAudio.currentSrc || '')) {
                this.resumeLofiPlaylist();
            } else {
                this.playLofiPlaylist();
            }
        }
        
        // Tron theme is active - start Spotify (disabled to avoid playlist restart issues)
        // if (this.currentImmersiveTheme === 'tron') {
        //     this.startTronSpotify();
        //     console.log('🎨 Tron theme active - background + Spotify started');
        // }
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            this.updateSections();
            this.updateSessionInfo();
            
            // Save timer state every second (uses sessionStorage - persists on reload but not on tab close)
            this.saveTimerState();
            
            // Music ducking: fade out 2s before end of section to prioritize alerts
            // Accumulate focus seconds for day streak when on a focus session and not cheating
            if (this.isWorkSession && !this.isLongBreak) {
                // If user skipped sections, we mark cheatedDuringFocusInCycle elsewhere; here we only count naturally ticking time
                this.focusSecondsToday = (this.focusSecondsToday || 0) + 1;
                try {
                    localStorage.setItem('focusSecondsToday', String(this.focusSecondsToday));
                    localStorage.setItem('focusSecondsTodayDate', new Date().toDateString());
                } catch (_) {}
                // Once we pass 60s and haven't counted a streak yet today, award it
                if ((this.focusSecondsToday >= 60) && !this.hasCompletedFocusToday) {
                    this.updateStreak();
                }
            }
            if (this.timeLeft === 2) {
                this.fadeMusicOut(2000);
                this.isDucked = true;
            }
            
            // Realtime tracking: focus-only for total focus time
            if (this.currentSection % 2 === 1) {
                this.addFocusTime(1);
            }
            // Realtime tracking: technique time (focus + breaks) for Most Used Technique
            this.addTechniqueTime(1);
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.startPauseBtn.classList.remove('running');
        
        clearInterval(this.interval);
        this.playUiSound('pause');
        
        // 🎯 Track Timer Paused event to Mixpanel
        if (window.mixpanelTracker) {
            window.mixpanelTracker.trackTimerPause();
            console.log('📊 Timer paused event tracked to Mixpanel');
        }
        
        // Close all open modals to focus on timer
        this.closeAllModals();
        
        // Pause background music if playing
        if (this.lofiPlaying) {
            this.pauseLofiPlaylist();
        }
        
        // Tron theme is active - pause Spotify (disabled to avoid playlist restart issues)
        // if (this.currentImmersiveTheme === 'tron') {
        //     this.pauseTronSpotify();
        //     console.log('🎨 Tron theme paused - background + Spotify paused');
        // }
        
        // Update session info to potentially show "Ready to focus?"
        this.updateSessionInfo();
        
        // Update title to show paused state
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        // Use current task content for title
        let titleText;
        if (this.currentTaskName) {
            titleText = this.currentTaskName;
        } else {
            // Fallback to session type if no current task
            if (this.isWorkSession) {
                titleText = 'Focus';
            } else {
                titleText = this.isLongBreak ? 'Long Break' : 'Short Break';
            }
        }
        document.title = `${timeString} - ${titleText} (Paused)`;
    }
    
    pauseTimerSilent() {
        this.isRunning = false;
        this.startPauseBtn.classList.remove('running');
        
        clearInterval(this.interval);
        
        // Close all open modals to focus on timer
        this.closeAllModals();
        
        // Pause background music if playing
        if (this.ambientPlaying || this.buryTheLightPlaying || this.rainPlaying || this.naturePlaying) {
            if (this.naturePlaying) {
                this.pauseNatureSound();
            } else {
                this.pausePlaylist();
            }
        }
        
        // Pause Tron music if Tron theme is active
        if (this.currentImmersiveTheme === 'tron') {
            this.pauseTronMusic();
        }
        
        // No sound - silent pause
        
        // Update title to show paused state
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        // Use current task content for title
        let titleText;
        if (this.currentTaskName) {
            titleText = this.currentTaskName;
        } else {
            // Fallback to session type if no current task
            if (this.isWorkSession) {
                titleText = 'Focus';
            } else {
                titleText = this.isLongBreak ? 'Long Break' : 'Short Break';
            }
        }
        document.title = `${timeString} - ${titleText} (Paused)`;
    }
    
    goToPreviousSection() {
        if (this.currentSection > 1) {
            this.pauseTimerSilent(); // Pause without sound
            
            // 🎯 Track Timer Skipped event to Mixpanel
            if (window.mixpanelTracker) {
                const currentSectionInfo = this.cycleSections[this.currentSection - 1];
                const sessionType = currentSectionInfo.type === 'work' ? 'work' : 
                                   currentSectionInfo.type === 'long-break' ? 'long_break' : 'short_break';
                
                window.mixpanelTracker.trackTimerSkip(sessionType, 'navigation');
                console.log('📊 Timer skipped (previous) event tracked to Mixpanel');
            }
            
            // Track time completed in current focus session before jumping
            if (this.currentSection % 2 === 1 && this.isWorkSession) { // if currently in a focus session
                const timeCompleted = this.cycleSections[this.currentSection - 1].duration - this.timeLeft;
                this.actualFocusTimeCompleted += timeCompleted;
            }
            this.currentSection--;
            this.loadCurrentSection();
            this.updateNavigationButtons();
        }
    }
    
    goToNextSection() {
        if (this.currentSection < this.cycleSections.length) {
            this.pauseTimerSilent(); // Pause without sound
            
            // 🎯 Track Timer Skipped event to Mixpanel
            if (window.mixpanelTracker) {
                const currentSectionInfo = this.cycleSections[this.currentSection - 1];
                const sessionType = currentSectionInfo.type === 'work' ? 'work' : 
                                   currentSectionInfo.type === 'long-break' ? 'long_break' : 'short_break';
                
                window.mixpanelTracker.trackTimerSkip(sessionType, 'navigation');
                console.log('📊 Timer skipped (next) event tracked to Mixpanel');
            }
            
            // Track time completed in current focus session before jumping
            if (this.currentSection % 2 === 1 && this.isWorkSession) { // if currently in a focus session
                const timeCompleted = this.cycleSections[this.currentSection - 1].duration - this.timeLeft;
                this.actualFocusTimeCompleted += timeCompleted;
            }
            this.currentSection++;
            this.loadCurrentSection();
            this.updateNavigationButtons();
        }
    }
    
    loadCurrentSection() {
        const currentSectionInfo = this.cycleSections[this.currentSection - 1];
        this.timeLeft = currentSectionInfo.duration;
        
        // Update session type flags
        this.isWorkSession = currentSectionInfo.type === 'work';
        this.isLongBreak = currentSectionInfo.type === 'long-break';
        
        // Update current session task
        this.updateCurrentSessionTask();
        
        // Keep task label in sync with completed sessions (only for work sessions)
        if (this.isWorkSession) {
            try {
                // Calculate how many task slots have been completed so far
                const selected = this.getSelectedTasks();
                let slotsCompleted = 0;
                selected.forEach(task => {
                    const cfg = this.getTaskConfig(task.id);
                    const total = Math.max(1, cfg.sessions || 1);
                    const done = Math.min(cfg.completedSessions || 0, total);
                    slotsCompleted += done;
                });
                if (Array.isArray(this.taskQueue) && this.taskQueue.length > 0) {
                    if (slotsCompleted >= this.taskQueue.length) {
                        this.currentTaskIndex = this.taskQueue.length; // beyond queue → Focus label
                        this.currentTask = null;
                    } else {
                        this.currentTaskIndex = slotsCompleted;
                        this.currentTask = this.taskQueue[this.currentTaskIndex];
                    }
                }
            } catch (_) {}
        } else {
            // For breaks, set current task based on break type
            if (this.isLongBreak) {
                this.currentTask = { content: "Long Break", source: 'break' };
            } else {
                this.currentTask = { content: "Short Break", source: 'break' };
            }
            this.currentTaskName = this.currentTask.content;
        }
        
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateSessionInfo();
    }
    
    updateNavigationButtons() {
        // Update previous button
        if (this.prevSectionBtn) {
            this.prevSectionBtn.disabled = this.currentSection <= 1;
        }
        
        // Update next button
        if (this.nextSectionBtn) {
            this.nextSectionBtn.disabled = this.currentSection >= this.cycleSections.length;
        }
    }
    
    handleKeydown(e) {
        // Command+K or Ctrl+K to open shortcuts modal (handle before input check)
        if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
            e.preventDefault();
            this.showShortcutsModal();
            return;
        }
        
        // Only handle other shortcuts if no input/textarea is focused
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Space or Enter to toggle timer
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault(); // Prevent page scroll on space
            this.toggleTimer();
        }
        
        // R to reset timer (with confirmation)
        if (e.code === 'KeyR') {
            e.preventDefault();
            this.showResetConfirmationModal();
        }
        
        
        // A or ArrowLeft for previous section
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            e.preventDefault();
            this.goToPreviousSection();
        }
        
        // D or ArrowRight for next section
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            e.preventDefault();
            this.goToNextSection();
        }
    }
    completeSession() {
        // Always stop ticking immediately
        this.pauseTimer();
        
        // Play notification sound
        this.playNotification();
        
        // 🎯 Track Timer Completed event to Mixpanel
        if (window.mixpanelTracker) {
            const currentSectionInfo = this.cycleSections[this.currentSection - 1];
            const sessionType = currentSectionInfo.type === 'work' ? 'work' : 
                               currentSectionInfo.type === 'long-break' ? 'long_break' : 'short_break';
            
            window.mixpanelTracker.trackTimerComplete(sessionType, true);
            console.log('📊 Timer completed event tracked to Mixpanel');
        }
        
        // Advance section pointer
        const finishedWasFocus = this.isWorkSession === true;
        this.currentSection++;
        
        // Did we just finish the last section of the cycle?
        let cycleCompleted = false;
        let lastCycleWasLegitimate = false;
        if (this.currentSection > this.cycleSections.length) {
            cycleCompleted = true;
            this.currentSection = 1; // reset to first section of next cycle
            
            // Add time from the last completed focus session
            if (finishedWasFocus) {
                const timeCompleted = this.cycleSections[this.currentSection - 2].duration; // Previous section (just finished)
                this.actualFocusTimeCompleted += timeCompleted;
            }
            
            // Check if enough focus time was actually completed
            lastCycleWasLegitimate = (this.actualFocusTimeCompleted >= this.requiredFocusTimeForCycle);
            if (lastCycleWasLegitimate) {
                this.updateCycleCounter();
            }
            // Reset focus time tracker for next cycle
            this.actualFocusTimeCompleted = 0;
        }
        
        // Count time from naturally finished focus session (when not using Next/Back)
        if (finishedWasFocus) {
            const timeCompleted = this.cycleSections[this.currentSection - 2].duration; // Previous section (just finished)
            this.actualFocusTimeCompleted += timeCompleted;
            // Mark todoist task and advance queue BEFORE loading next section so the label updates immediately
            this.completeCurrentTodoistTaskIfAny();
            this.advanceTaskQueueAfterFocus();
            
            // Refresh task panel if it's open to show real-time updates
            this.refreshTaskModalIfOpen();
            
            // Update day streak only if no cheating occurred during focus session
            if (!this.cheatedDuringFocusInCycle) {
                this.updateStreak();
            }
        }

        // Load current section data
        const currentSectionInfo = this.cycleSections[this.currentSection - 1];
        this.timeLeft = currentSectionInfo.duration;
        this.isWorkSession = currentSectionInfo.type === 'work';
        this.isLongBreak = currentSectionInfo.type === 'long-break';
        
        // Update UI to reflect the next section
        this.updateCurrentTaskFromQueue();
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateSessionInfo();
        this.updateCurrentSessionTask();

        if (cycleCompleted) {
            // Ensure fully paused state and correct button/title
            this.pauseTimerSilent();
            this.startPauseBtn.classList.remove('running');
            this.isRunning = false;
            // Clear saved timer state when cycle completes
            this.clearTimerState();
            // No modal, just stop at end of cycle
            return;
        }
        
        // Not end of cycle → auto-start next section after brief delay
        setTimeout(() => {
            this.startTimer();
            // After new section starts, restore music after 2s
            setTimeout(() => {
                if (this.isDucked) {
                    this.fadeMusicIn(2000);
                    this.isDucked = false;
                }
            }, 2000);
        }, 600);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update main display
        this.timeElement.textContent = timeString;
        
        // Update browser tab title with current task content
        let titleText;
        if (this.currentTaskName) {
            titleText = this.currentTaskName;
        } else {
            // Fallback to session type if no current task
            if (this.isWorkSession) {
                titleText = 'Work';
            } else {
                titleText = this.isLongBreak ? 'Long Break' : 'Short Break';
            }
        }
        document.title = `${timeString} - ${titleText}`;
    }
    
    updateProgress() {
        const currentSectionInfo = this.cycleSections[this.currentSection - 1];
        const totalTime = currentSectionInfo.duration;
        
        // Elapsed within current section (in seconds)
        const elapsedInSection = currentSectionInfo.duration - this.timeLeft;
        const sectionProgress = Math.max(0, Math.min(1, elapsedInSection / totalTime));
        
        // SIMPLIFIED: Only show current section progress (Tesla style)
        // Show a simple circular progress for the current session only
        const CIRCUMFERENCE = 2 * Math.PI * 45; // 283
        const progressLength = CIRCUMFERENCE * sectionProgress;
        
        // Hide all overlays except the first one (we'll use it for current progress)
        this.progressOverlays.forEach((ol, i) => {
            if (i === 0) {
                // Show only the current section progress
                ol.style.display = 'inline';
                ol.style.stroke = '#ffffff';
                ol.setAttribute('stroke-dasharray', `${progressLength} ${CIRCUMFERENCE}`);
                ol.setAttribute('stroke-dashoffset', '0');
            } else {
                // Hide all other overlays
                ol.style.display = 'none';
            }
        });
    }
    
    updateSegmentedProgress(totalProgress) {
        const { CIRCUMFERENCE, GAP, scaledLengths } = this._segmentMeta;
        
        // Update each overlay to match its own segment completion
        let cursor = 0;
        this.progressOverlays.forEach((ol, i) => {
            if (i < scaledLengths.length) {
                const segLen = scaledLengths[i];
                let fillLen = 0;

                // Set overlay color based on section type
                // Color-coded indicators per segment type
                const section = this.cycleSections[i];
                if (section) {
                    switch (section.type) {
                        case 'work':
                            ol.style.stroke = '#ffffff'; // White for work
                            break;
                        case 'break':
                            ol.style.stroke = '#ffffff'; // White for short breaks
                            break;
                        case 'long-break':
                            ol.style.stroke = '#ffffff'; // White for long breaks
                            break;
                        default:
                            ol.style.stroke = '#ffffff';
                    }
                }
                
                // Check if this segment should be visible
                if (totalProgress > cursor) {
                    // This segment has started
                    if (totalProgress >= cursor + segLen) {
                        // Segment is fully filled
                        fillLen = segLen;
                    } else {
                        // Segment is partially filled
                        const progressInSegment = totalProgress - cursor;
                        if (progressInSegment > 0) {
                            fillLen = Math.min(progressInSegment, segLen);
                        }
                    }
                }

                if (fillLen > 0) {
                    ol.style.display = 'inline';
                    ol.setAttribute('stroke-dasharray', `${fillLen} ${CIRCUMFERENCE}`);
                    ol.setAttribute('stroke-dashoffset', `${-cursor}`);
                } else {
                    // Hide completely to avoid small round-cap dots at segment start
                    ol.style.display = 'none';
                }

                // Move cursor to next segment position (including gap)
                cursor += segLen + GAP;
            } else {
                // Hide extra overlays if current technique has fewer sections
                ol.style.display = 'none';
            }
        });
    }
    
    updateSections() {
        // No highlight: segments remain uniform per type
    }
    

    // Get total number of focus sessions for current technique
    getTotalFocusSessions() {
        return this.sessionsPerCycle || 4; // Default to 4 if not set
    }

    // Build an execution queue from selected tasks and their configured sessions
    rebuildTaskQueue() {
        // Only include tasks that are explicitly selected
        const selected = this.getSelectedTasks();
        const queue = [];
        
        // Calculate total sessions needed
        const totalSessions = this.getTotalFocusSessions();
        
        selected.forEach(task => {
            const config = this.getTaskConfig(task.id);
            const totalSessions = Math.max(1, config.sessions || 1);
            const completedSessions = config.completedSessions || 0;
            const remainingSessions = Math.max(0, totalSessions - completedSessions);
            
            for (let i = 0; i < remainingSessions; i++) {
                queue.push({ id: task.id, content: task.content, source: task.source || 'local' });
            }
        });
        
        // If we have more focus sessions than tasks, add empty slots for the extra sessions
        const totalTaskSlots = queue.length;
        if (totalSessions > totalTaskSlots) {
            const extraSessions = totalSessions - totalTaskSlots;
            for (let i = 0; i < extraSessions; i++) {
                queue.push({ id: null, content: '', source: 'empty' });
            }
        }
        
        this.taskQueue = queue;
        this.currentTaskIndex = 0;
        this.currentTask = this.taskQueue.length > 0 ? this.taskQueue[0] : null;

        // Keep sessionTasks in sync with taskQueue
        this.updateSessionTasksFromSelected();

    }

    getCurrentTaskLabel() {
        // Show session type instead of "Add Task"
        if (this.isWorkSession) {
            return 'Pomodoro';
        } else if (this.isLongBreak) {
            return 'Long Break';
        } else {
            return 'Short Break';
        }
    }

    // Advance to next task slot after finishing a focus session
    advanceTaskQueueAfterFocus() {
        if (!this.taskQueue || this.taskQueue.length === 0) return;
        
        // Increment completed sessions for current task (only if it's a real task, not empty slot)
        const finishedTaskId = this.currentTask && this.currentTask.id ? this.currentTask.id : null;
        if (finishedTaskId) {
            this.incrementTaskCompletedSessions(finishedTaskId);
            // If the task reached its planned sessions, mark completed and rebuild queue
            const cfg = this.getTaskConfig(finishedTaskId);
            const planned = Math.max(1, cfg.sessions || 1);
            const done = Math.min(cfg.completedSessions || 0, planned);
            const taskFinished = done >= planned;
            if (taskFinished) {
                try { this.markLocalTaskAsCompleted(finishedTaskId); } catch (_) {}
                // Queue rebuilt from remaining selected tasks
                if (this.taskQueue && this.taskQueue.length > 0) {
                    this.currentTaskIndex = 0;
                    this.currentTask = this.taskQueue[0];
                } else {
                    this.currentTaskIndex = 0;
                    this.currentTask = null; // Will show Focus
                }
                return;
            }
        }
        
        // Advance to next slot in queue
        if (this.currentTaskIndex < this.taskQueue.length - 1) {
            this.currentTaskIndex += 1;
            this.currentTask = this.taskQueue[this.currentTaskIndex];
        } else {
            // End of queue, fallback to Focus
            this.currentTask = null;
        }
    }

    // Mark current task instance as completed in Todoist if applicable
    async completeCurrentTodoistTaskIfAny() {
        const current = this.taskQueue && this.taskQueue[this.currentTaskIndex] ? this.taskQueue[this.currentTaskIndex] : null;
        if (!current) return;
        if (current.source !== 'todoist') return;
        if (!this.isAuthenticated || !this.user) return;
        try {
            // Extract original Todoist ID if we used a local prefix
            const originalId = String(current.id).startsWith('todoist_') ? String(current.id).replace('todoist_', '') : current.id;
            
            // Check if Developer Mode is active
            const viewMode = localStorage.getItem('viewMode');
            const devModeParam = viewMode === 'pro' ? '&devMode=pro' : '';
            
            await fetch(`/api/todoist-complete?id=${encodeURIComponent(originalId)}${devModeParam}`, {
                method: 'POST'
            });
        } catch (_) {}
    }

    openTasksCompletedModal() {}

    markLocalTaskAsCompleted(taskId) {
        if (!taskId) return;
        const tasks = this.getLocalTasks();
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            tasks[idx].completed = true;
            this.setLocalTasks(tasks);
            
            // If it's a Todoist task, mark it as completed in Todoist
            if (tasks[idx].source === 'todoist') {
                this.completeTodoistTaskInTodoist(taskId);
            }
        }
        // Deselect the completed task so it doesn't show the blue accent
        this.setTaskConfig(taskId, { selected: false });
        this.updateCurrentTaskBanner();
        this.rebuildTaskQueue();
    }

    async completeTodoistTaskInTodoist(taskId) {
        if (!taskId) return;
        if (!this.isAuthenticated || !this.user) return;
        
        try {
            // Extract original Todoist ID if we used a local prefix
            const originalId = String(taskId).startsWith('todoist_') ? String(taskId).replace('todoist_', '') : taskId;
            
            // Check if Developer Mode is active
            const viewMode = localStorage.getItem('viewMode');
            const devModeParam = viewMode === 'pro' ? '&devMode=pro' : '';
            
            // Call the API to mark task as completed in Todoist (using query parameter)
            await fetch(`/api/todoist-complete?id=${encodeURIComponent(originalId)}${devModeParam}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error completing Todoist task:', error);
        }
    }

    showTaskCompletedModal() {}
    
    updateSessionInfo() {
        // Tesla-style: Combined label "Pomodoro 1/4" OR "Ready to focus?"
        if (this.sessionLabelElement) {
            // Show "Ready to focus?" ONLY for Pomodoro/Focus sessions when:
            // 1. Timer hasn't been started (!isRunning)
            // 2. Timer is at initial time (fresh state)
            // 3. Currently in a work session (not break)
            const isAtInitialTime = this.timeLeft === this.cycleSections[this.currentSection - 1]?.duration;
            const shouldShowReadyToFocus = !this.isRunning && isAtInitialTime && this.isWorkSession;
            
            // Helper function to add chevron icon to session label
            const createSessionLabelHTML = (text) => {
                return `<span>${text}</span><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="session-label-icon"><path d="m9 18 6-6-6-6"/></svg>`;
            };
            
            if (shouldShowReadyToFocus) {
                this.sessionLabelElement.innerHTML = createSessionLabelHTML('Ready to focus?');
            } else {
                // Show session info: "Pomodoro 1/4", "Short Break", etc.
                const workSessions = this.cycleSections.filter(s => s.type === 'work');
                const totalWorkSessions = workSessions.length;
                
                // Calculate current work session number
                let currentWorkSession = 0;
                for (let i = 0; i < this.currentSection; i++) {
                    if (this.cycleSections[i] && this.cycleSections[i].type === 'work') {
                        currentWorkSession++;
                    }
                }
                
                // Get session type
                const sessionLabel = this.getCurrentTaskLabel();
                
                // Helper function to truncate text to max 15 characters
                const truncateText = (text, maxLength = 15) => {
                    if (!text) return text;
                    // Count actual characters including emojis, spaces, etc.
                    const chars = Array.from(text);
                    if (chars.length <= maxLength) return text;
                    return chars.slice(0, maxLength).join('') + '...';
                };
                
                // Combine: "Task Name 1/4" or "Pomodoro 1/4", "Short Break", "Long Break"
                if (this.isWorkSession) {
                    // Use task name if available, otherwise use session label (Pomodoro)
                    const displayName = this.currentTaskName ? truncateText(this.currentTaskName) : sessionLabel;
                    this.sessionLabelElement.innerHTML = createSessionLabelHTML(`${displayName} ${currentWorkSession}/${totalWorkSessions}`);
                } else {
                    this.sessionLabelElement.innerHTML = createSessionLabelHTML(sessionLabel);
                }
            }
        }
        
        // Keep for backward compatibility (hidden via CSS)
        if (this.sessionInfoElement) {
            const workSessions = this.cycleSections.filter(s => s.type === 'work');
            const totalWorkSessions = workSessions.length;
            let currentWorkSession = 0;
            for (let i = 0; i < this.currentSection; i++) {
                if (this.cycleSections[i] && this.cycleSections[i].type === 'work') {
                    currentWorkSession++;
                }
            }
            this.sessionInfoElement.textContent = `${currentWorkSession}/${totalWorkSessions}`;
        }
        
        // Update current task display (hidden via CSS)
        this.updateCurrentTaskDisplay();
    }
    
    setCurrentTask(taskName) {
        this.currentTaskName = taskName;
        this.updateCurrentTaskDisplay();
    }
    
    clearCurrentTask() {
        this.currentTaskName = null;
        this.updateCurrentTaskDisplay();
    }
    
    updateCurrentTaskDisplay() {
        if (this.currentTaskElement) {
            // Show session type: Pomodoro, Short Break, or Long Break
            const sessionLabel = this.getCurrentTaskLabel();
            this.currentTaskElement.textContent = sessionLabel;
                this.currentTaskElement.style.display = 'block';
        }
    }

    updateCurrentTaskFromQueue() {
        console.log('🎯 updateCurrentTaskFromQueue called', {
            isWorkSession: this.isWorkSession,
            taskQueueLength: this.taskQueue?.length,
            taskQueue: this.taskQueue?.map(t => t.content)
        });
        
        // Update current task based on task queue and current session
        if (this.isWorkSession && this.taskQueue && this.taskQueue.length > 0) {
            // Calculate how many task slots have been completed so far
            const selected = this.getSelectedTasks();
            console.log('🎯 Selected tasks:', selected.map(t => t.content));
            
            let slotsCompleted = 0;
            selected.forEach(task => {
                const cfg = this.getTaskConfig(task.id);
                const total = Math.max(1, cfg.sessions || 1);
                const done = Math.min(cfg.completedSessions || 0, total);
                slotsCompleted += done;
            });
            
            console.log('🎯 slotsCompleted:', slotsCompleted, 'taskQueue.length:', this.taskQueue.length);
            
            if (slotsCompleted >= this.taskQueue.length) {
                this.currentTaskIndex = this.taskQueue.length; // beyond queue → Focus label
                this.currentTask = null;
                this.currentTaskName = null;
                console.log('🎯 All tasks completed, setting currentTaskName to null');
            } else {
                this.currentTaskIndex = slotsCompleted;
                this.currentTask = this.taskQueue[this.currentTaskIndex];
                this.currentTaskName = this.currentTask ? this.currentTask.content : null;
                console.log('🎯 Setting currentTaskName to:', this.currentTaskName);
            }
        } else if (this.isWorkSession) {
            // In work session but no tasks selected - show "Focus"
            this.currentTask = null;
            this.currentTaskName = null;
            console.log('🎯 Work session but no tasks, setting currentTaskName to null');
        } else {
            // Not in work session
            this.currentTask = null;
            this.currentTaskName = null;
            console.log('🎯 Not in work session, setting currentTaskName to null');
        }
        
        console.log('🎯 Final currentTaskName:', this.currentTaskName);
        this.updateCurrentTaskDisplay();
    }
    
    // Initialize tasks for each focus session from selected tasks
    initializeSessionTasks() {
        this.updateSessionTasksFromSelected();
        this.updateCurrentSessionTask();
    }
    
    // Update session tasks from selected tasks in modal
    updateSessionTasksFromSelected() {
        const selectedTasks = this.getSelectedTasks();
        
        // Only reset sessionTasks if we have selected tasks (user actively selected tasks)
        // Don't reset when changing techniques if no tasks are selected
        if (selectedTasks.length > 0) {
            this.sessionTasks = [];
            
            // Build task queue from selected tasks
            selectedTasks.forEach(task => {
                const config = this.getTaskConfig(task.id);
                const totalSessions = Math.max(1, config.sessions || 1);
                const completedSessions = config.completedSessions || 0;
                const remainingSessions = Math.max(0, totalSessions - completedSessions);
                
                for (let i = 0; i < remainingSessions; i++) {
                    this.sessionTasks.push(task.content);
                }
            });
        }
        // If no tasks selected, keep existing sessionTasks (don't reset them)
        
        // Calculate total sessions needed
        const totalSessions = this.getTotalFocusSessions();
        
        // If we have more focus sessions than tasks, add empty slots for the extra sessions
        const totalTaskSlots = this.sessionTasks.length;
        if (totalSessions > totalTaskSlots) {
            const extraSessions = totalSessions - totalTaskSlots;
            for (let i = 0; i < extraSessions; i++) {
                this.sessionTasks.push(''); // Empty string for sessions without tasks
            }
        }
        
        // If no tasks are selected, use default tasks
        if (this.sessionTasks.length === 0) {
            this.sessionTasks = [
                "Aplicando a Jobs",
                "Making Interviews", 
                "Studying React",
                "Writing Documentation",
                "Code Review",
                "Planning Sprint",
                "Learning TypeScript",
                "Designing UI"
            ];
        }
    }
    
    // Update current session task based on current section
    updateCurrentSessionTask() {
        if (this.isWorkSession && this.sessionTasks.length > 0) {
            // Calculate which focus session this is (1, 3, 5, 7 for a 4-session cycle)
            const focusSessionNumber = Math.floor((this.currentSection + 1) / 2);
            const taskIndex = focusSessionNumber - 1;
            
            // If we have a task for this session and it's not empty, use it
            if (taskIndex < this.sessionTasks.length && this.sessionTasks[taskIndex] && this.sessionTasks[taskIndex] !== '') {
                this.setCurrentTask(this.sessionTasks[taskIndex]);
            } else {
                // If no task for this session (empty slot), clear the task to show just "Focus"
                this.clearCurrentTask();
            }
        } else if (this.isLongBreak) {
            // Show long break information
            this.setCurrentTask("Long Break");
        } else {
            // Show short break information
            this.setCurrentTask("Short Break");
        }
    }
    
    // Example tasks for demonstration
    getExampleTasks() {
        return [
            "Aplicando a Jobs",
            "Making Interviews", 
            "Studying React",
            "Writing Documentation",
            "Code Review",
            "Planning Sprint",
            "Learning TypeScript",
            "Designing UI"
        ];
    }
    
    // Method to cycle through tasks for current session
    cycleToNextTask() {
        if (this.isWorkSession && this.sessionTasks.length > 0) {
            const focusSessionNumber = Math.floor((this.currentSection + 1) / 2);
            const taskIndex = Math.min(focusSessionNumber - 1, this.sessionTasks.length - 1);
            
            // Get all available tasks (from selected tasks or default)
            const selectedTasks = this.getSelectedTasks();
            let allTasks = [];
            
            if (selectedTasks.length > 0) {
                allTasks = selectedTasks.map(task => task.content);
            } else {
                allTasks = this.getExampleTasks();
            }
            
            const currentIndex = allTasks.indexOf(this.sessionTasks[taskIndex]);
            const nextIndex = (currentIndex + 1) % allTasks.length;
            
            // Update the task for this session
            this.sessionTasks[taskIndex] = allTasks[nextIndex];
            this.setCurrentTask(this.sessionTasks[taskIndex]);
        }
    }
    
    playNotification() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio notification not supported');
        }
    }
    
    // checkWelcomeModal() - REMOVED
    
    // checkPomodoroIntro() - REMOVED
    // showPomodoroIntro() - REMOVED  
    // closePomodoroIntro() - REMOVED

    showLofiLoginModal() {
        // Create login required modal using upgrade modal styling (same as techniques)
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'upgrade-modal-overlay signup-reminder';
        
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        
        modal.innerHTML = `
            <button class="close-upgrade-x" id="closeLofiLoginModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="upgrade-content">
                <div class="upgrade-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                </div>
                <h3>Lofi Music</h3>
                <p>Curated beats for deep focus. Create a free account to unlock this premium background music.</p>
                <div class="upgrade-features">
                    <div class="upgrade-feature">
                        <span class="upgrade-feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 6 9 17l-5-5"/>
                            </svg>
                        </span>
                        <span class="upgrade-feature-text">Curated lofi beats for optimal focus</span>
                    </div>
                    <div class="upgrade-feature">
                        <span class="upgrade-feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 6 9 17l-5-5"/>
                            </svg>
                        </span>
                        <span class="upgrade-feature-text">Multiple playlists to match your mood</span>
                    </div>
                    <div class="upgrade-feature">
                        <span class="upgrade-feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 6 9 17l-5-5"/>
                            </svg>
                        </span>
                        <span class="upgrade-feature-text">High-quality audio for immersive experience</span>
                    </div>
                    <div class="upgrade-feature">
                        <span class="upgrade-feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 6 9 17l-5-5"/>
                            </svg>
                        </span>
                        <span class="upgrade-feature-text">Seamless integration with all focus techniques</span>
                </div>
                </div>
                <div class="upgrade-required-buttons">
                    <button class="upgrade-btn" id="lofiSignupBtn">Sign up for free</button>
                    <button class="cancel-btn" id="lofiMaybeLaterBtn">Maybe later</button>
                </div>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Event listeners
        const closeBtn = modal.querySelector('#closeLofiLoginModal');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        const signupBtn = modal.querySelector('#lofiSignupBtn');
        signupBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            window.location.href = 'https://accounts.superfocus.live/sign-up?redirect_url=' + encodeURIComponent(window.location.href);
        });
        
        const cancelBtn = modal.querySelector('#lofiMaybeLaterBtn');
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }

    showLoginRequiredModal(technique) {
        // Get technique information
        const techniqueInfo = {
            'pomodoro-plus': {
                name: 'Long Pomodoro',
                description: 'Extended focus sessions for deep work',
                benefits: [
                    'Perfect for complex projects requiring sustained attention',
                    'Reduces context switching between tasks',
                    'Ideal for deep work and creative projects',
                    'Maintains focus for longer periods'
                ]
            },
            'ultradian-rhythm': {
                name: 'Ultradian Rhythm',
                description: 'Natural biological rhythm-based focus technique',
                benefits: [
                    'Aligns with your body\'s natural energy cycles',
                    'Optimizes energy levels and cognitive performance',
                    'Reduces mental fatigue during long sessions',
                    'Based on scientific research on attention spans'
                ]
            },
            'custom': {
                name: 'Custom Timer',
                description: 'Create your own personalized focus technique',
                benefits: [
                    'Fully customizable to your work style',
                    'Experiment with different timing patterns',
                    'Adapt to your unique attention span',
                    'Create the perfect technique for your needs'
                ]
            }
        };
        
        const info = techniqueInfo[technique];
        if (!info) return;
        
        // Create login required modal using upgrade modal styling
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'upgrade-modal-overlay signup-reminder';
        
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        
        modal.innerHTML = `
            <button class="close-upgrade-x" id="closeLoginRequiredModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="upgrade-content">
                <div class="upgrade-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coffee-icon lucide-coffee">
                        <path d="M10 2v2"/>
                        <path d="M14 2v2"/>
                        <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>
                        <path d="M6 2v2"/>
                    </svg>
                </div>
                <h3>${info.name}</h3>
                <p>${info.description}. Create a free account to unlock this advanced focus technique.</p>
                <div class="upgrade-features">
                    ${info.benefits.map(benefit => `
                        <div class="upgrade-feature">
                            <span class="upgrade-feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 6 9 17l-5-5"/>
                                </svg>
                            </span>
                            <span class="upgrade-feature-text">${benefit}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="upgrade-required-buttons">
                    <button class="upgrade-btn" id="loginRequiredSignupBtn">Sign up for free</button>
                    <button class="cancel-btn" id="dismissLoginRequiredBtn">Maybe later</button>
                </div>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        // Prevent background scroll while modal open
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        document.getElementById('loginRequiredSignupBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            this.signupButton.click();
        });
        
        document.getElementById('dismissLoginRequiredBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        document.getElementById('closeLoginRequiredModal').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }

    showLoadingScreen() {
        if (this.loadingScreen && !this.isLoading) {
            this.loadingScreen.style.display = 'flex';
            this.isLoading = true;
            this.loadingStartTime = Date.now();
        }
    }

    hideLoadingScreen() {
        if (this.loadingScreen && this.isLoading) {
            const elapsed = Date.now() - (this.loadingStartTime || 0);
            
            // Only hide if we've shown it for minimum time or if it's been too long
            if (elapsed >= this.minLoadingTime || elapsed > 5000) {
                this.loadingScreen.style.display = 'none';
                this.isLoading = false;
                // Remove from DOM immediately - no transition
                if (this.loadingScreen && this.loadingScreen.parentNode) {
                    this.loadingScreen.parentNode.removeChild(this.loadingScreen);
                }
            } else {
                // Wait for minimum time
                setTimeout(() => this.hideLoadingScreen(), this.minLoadingTime - elapsed);
            }
        }
    }

    checkConnectionSpeed() {
        // Prefer explicit network information when available
        try {
            if ('connection' in navigator && navigator.connection) {
                const { effectiveType, downlink, rtt } = navigator.connection;
                // Consider slow only on 2G/3G or very poor 4G
                if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
                    return true;
                }
                if (effectiveType === '4g') {
                    // Treat as slow 4G only if bandwidth is clearly low or RTT very high
                    if ((typeof downlink === 'number' && downlink < 0.8) || (typeof rtt === 'number' && rtt > 400)) {
                        return true;
                    }
                }
                // 5g typically reports as 4g in many browsers; above thresholds avoid false positives
            }
        } catch (_) {}
        
        // Fallback: do NOT infer slowness from generic timers to avoid false positives on fast networks
        return false;
    }

    checkIfStillLoading() {
        // Determine readiness based on essential UI presence only (avoid auth timing noise)
        const essentialElements = [
            document.getElementById('timerDisplay'),
            document.getElementById('startBtn'),
            document.getElementById('techniqueDropdown')
        ];
        if (essentialElements.some(el => !el)) {
            return true;
        }
        return false;
    }

    // hideWelcomeModal() - REMOVED
    // showSignupReminderModal() - REMOVED

    loadCassetteSounds() {
        try {
            this.cassetteSounds = new Audio('audio/ui/cassette-player-button-1.mp3');
            this.cassetteSounds.volume = 0.75; // Set volume to 75%
            this.cassetteSounds.preload = 'auto';
            
            // Create audio context for pitch and speed control
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioBuffer = null;
            this.loadAudioBuffer();
        } catch (error) {
            console.log('Could not load cassette sounds:', error);
            this.cassetteSounds = null;
        }
    }
    
    async loadAudioBuffer() {
        try {
            const response = await fetch('audio/ui/cassette-player-button-1.mp3');
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.log('Could not load audio buffer:', error);
        }
    }
    playUiSound(type) {
        // Try to use real cassette sounds with pitch/speed control first
        if (this.audioBuffer && this.audioContext) {
            try {
                this.playProcessedCassetteSound(type);
                return;
            } catch (error) {
                console.log('Processed cassette sound error:', error);
            }
        }
        
        // Fallback to regular audio element
        if (this.cassetteSounds) {
            try {
                this.cassetteSounds.currentTime = 0; // Reset to beginning
                this.cassetteSounds.play().catch(e => {
                    console.log('Cassette sound play failed:', e);
                    this.playSyntheticSound(type); // Fallback to synthetic
                });
                return;
            } catch (error) {
                console.log('Cassette sound error:', error);
            }
        }
        
        // Fallback to synthetic sounds
        this.playSyntheticSound(type);
    }
    
    // Minimal implementation: play decoded buffer with slight rate differences
    playProcessedCassetteSound(type) {
        if (!this.audioContext || !this.audioBuffer) throw new Error('No audio buffer');
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.75; // 75% volume
        
        // Original speed for play, slower for pause
        try {
            source.playbackRate.value = type === 'play' ? 1.0 : 0.75;
        } catch (_) {}
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        try { if (this.audioContext.state === 'suspended') this.audioContext.resume(); } catch (_) {}
        source.start(0);
        // Full duration for original sound
        try { source.stop(this.audioContext.currentTime + 0.5); } catch (_) {}
    }
    
    // Synthetic short beep as last-resort feedback
    playSyntheticSound(type) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this.audioContext;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            
            // Subtle click sound
            oscillator.type = 'sine';
            oscillator.frequency.value = type === 'play' ? 1200 : 800;
            
            // Very short, quick envelope for a subtle click
            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            oscillator.start(now);
            oscillator.stop(now + 0.1);
        } catch (_) {
            // As a final fallback, do nothing silently
        }
    }
    
    loadAudio() {
        // Simple audio loading - no complex audio options for now
        const savedAudio = localStorage.getItem('selectedAudio') || 'none';
        if (savedAudio !== 'none') {
            this.startAudio(savedAudio);
        }
    }
    
    startAudio(type) {
        if (type === 'none') return;
        
        // Simple audio implementation
        const audioUrls = {
            'rain-light': 'https://www.soundjay.com/misc/sounds/rain-light.mp3',
            'rain-heavy': 'https://www.soundjay.com/misc/sounds/rain-heavy.mp3',
            'forest-birds': 'https://www.soundjay.com/misc/sounds/forest-birds.mp3',
            'cafe-morning': 'https://www.soundjay.com/misc/sounds/cafe-morning.mp3'
        };
        
        if (audioUrls[type]) {
            this.backgroundAudio.src = audioUrls[type];
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = 0.3;
            this.backgroundAudio.play().catch(e => console.log('Audio play failed:', e));
            this.currentAudio = this.backgroundAudio;
        }
    }
    
    stopAudio() {
        if (this.currentAudio) {
            if (this.currentAudio.pause) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            this.currentAudio = null;
        }
    }
    
    updateDropdownState() {
        const body = document.body;
        
        if (this.isAuthenticated) {
            // Add authenticated class to body to hide all badges
            body.classList.add('authenticated-user');
        } else {
            // Remove authenticated class to show badges
            body.classList.remove('authenticated-user');
        }
    }

    initializeDropdownItemsState() {
        // Initialize dropdown items state immediately to prevent flash of enabled state
        const proTechniques = ['pomodoro-plus', 'ultradian-rhythm', 'custom'];
        
        this.dropdownItems.forEach(item => {
            const technique = item.getAttribute('data-technique');
            const requiresAccount = proTechniques.includes(technique);
            
            if (requiresAccount) {
                // Check if user is already authenticated (for immediate login scenarios)
                if (this.isAuthenticated) {
                    // Enable item for authenticated users
                    item.classList.remove('disabled');
                    const loginBtn = item.querySelector('.login-btn');
                    if (loginBtn) {
                        loginBtn.style.display = 'none';
                    }
                } else {
                    // Start with disabled state for guest users (will be updated when auth state is known)
                    item.classList.add('disabled');
                    const loginBtn = item.querySelector('.login-btn');
                    if (loginBtn) {
                        loginBtn.style.display = 'block';
                    }
                }
            }
        });
    }

    updateDropdownItemsState() {
        const proTechniques = ['pomodoro-plus', 'ultradian-rhythm', 'custom'];
        
        this.dropdownItems.forEach(item => {
            const technique = item.getAttribute('data-technique');
            const requiresAccount = proTechniques.includes(technique);
            
            if (requiresAccount) {
                // If auth readiness isn't known yet, keep items disabled to avoid flicker
                if (!this.authReady) {
                    item.classList.add('disabled');
                    const loginBtn = item.querySelector('.login-btn');
                    if (loginBtn) loginBtn.style.display = 'block';
                    return;
                }
                if (this.isAuthenticated) {
                    // Enable item for authenticated users
                    item.classList.remove('disabled');
                    const loginBtn = item.querySelector('.login-btn');
                    if (loginBtn) {
                        loginBtn.style.display = 'none';
                    }
                } else {
                    // Disable item for non-authenticated users
                    item.classList.add('disabled');
                    const loginBtn = item.querySelector('.login-btn');
                    if (loginBtn) {
                        loginBtn.style.display = 'block';
                    }
                }
            }
        });
    }

    setupLoginButtons() {
        // Setup login buttons for advanced techniques
        const loginButtons = [
            { id: 'loginPomodoroPlusBtn', technique: 'pomodoro-plus' },
            { id: 'loginUltradianBtn', technique: 'ultradian-rhythm' },
            { id: 'loginCustomBtn', technique: 'custom' }
        ];
        
        loginButtons.forEach(({ id, technique }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showLoginRequiredModal(technique);
                });
            }
        });
    }

    showCycleCompletedCelebration(wasLegitimate) {}

    // =========================
    // Todoist Integration (Free Beta)
    // =========================
    showTodoistModal() {
        // Build modal
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';

        const tokenValue = this.todoistToken || '';

        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.innerHTML = `
            <button class="close-focus-stats-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <h3>Integrations</h3>
            <p>Connect your productivity tools to enhance your focus sessions.</p>
            
            <!-- Todoist Integration -->
            <div class="integration-section">
                <div class="integration-header">
                    <div class="integration-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                        </svg>
                    </div>
                    <div class="integration-title">
                        <h4>Todoist</h4>
                        <p>Connect your Todoist account to sync tasks</p>
                    </div>
                </div>
                
                <div class="integration-content">
                    <div class="connection-section">
                        <div class="integration-status">
                            <span id="todoistStatusText" class="status-text">Disconnected</span>
                        </div>
                        <div class="integration-actions">
                            <button id="connectTodoistBtn" class="btn-primary">Connect to Todoist</button>
                            <button id="disconnectTodoistBtn" class="btn-secondary" style="display:none;">Disconnect</button>
                        </div>
                    </div>
                    
                    <div class="tasks-section">
                        <div class="tasks-header">
                            <h5>Your Tasks</h5>
                            <span class="tasks-subtitle">Select a task to focus on</span>
                        </div>
                        <div id="todoistTasksList" class="tasks-list"></div>
                    </div>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
        };

        modal.querySelector('.close-focus-stats-x').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        const connectBtn = modal.querySelector('#connectTodoistBtn');
        const disconnectBtn = modal.querySelector('#disconnectTodoistBtn');
        const fetchBtn = modal.querySelector('#fetchTodoistTasksBtn');
        const listEl = modal.querySelector('#todoistTasksList');
        const statusText = modal.querySelector('#todoistStatusText');

        const renderTasks = () => {
            listEl.innerHTML = '';
            if (!this.todoistTasks || this.todoistTasks.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.innerHTML = `
                    <div class="empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                    </div>
                    <div class="empty-text">No tasks loaded yet</div>
                    <div class="empty-subtext">Click "Fetch Tasks" to load your Todoist tasks</div>
                `;
                listEl.appendChild(empty);
                return;
            }
            
            this.todoistTasks.forEach(task => {
                const item = document.createElement('div');
                item.className = 'task-item';
                
                const taskContent = document.createElement('div');
                taskContent.className = 'task-content';
                
                const taskTitle = document.createElement('div');
                taskTitle.className = 'task-title';
                taskTitle.textContent = task.content || '(untitled)';
                
                const taskProject = document.createElement('div');
                taskProject.className = 'task-project';
                const pj = this.todoistProjectsById[task.project_id];
                taskProject.textContent = pj ? pj.name : 'Inbox';
                
                taskContent.appendChild(taskTitle);
                taskContent.appendChild(taskProject);
                
                const taskActions = document.createElement('div');
                taskActions.className = 'task-actions';
                
                const focusBtn = document.createElement('button');
                focusBtn.className = 'btn-focus';
                focusBtn.textContent = 'Focus This';
                focusBtn.addEventListener('click', () => {
                    this.currentTask = { id: task.id, content: task.content, project_id: task.project_id };
                    this.updateCurrentTaskBanner();
                    close();
                });
                
                const completeBtn = document.createElement('button');
                completeBtn.className = 'btn-secondary';
                completeBtn.textContent = '✓';
                completeBtn.title = 'Mark as completed';
                completeBtn.addEventListener('click', async () => {
                    try {
                        // Check if Developer Mode is active
                        const viewMode = localStorage.getItem('viewMode');
                        const devModeParam = viewMode === 'pro' ? '&devMode=pro' : '';
                        
                        await fetch(`/api/todoist-complete?id=${encodeURIComponent(task.id)}${devModeParam}`, { method: 'POST' });
                    } catch (_) {}
                    await this.fetchTodoistData();
                    renderTasks();
                });

                taskActions.appendChild(completeBtn);
                taskActions.appendChild(focusBtn);
                
                item.appendChild(taskContent);
                item.appendChild(taskActions);
                listEl.appendChild(item);
            });
        };

        connectBtn.addEventListener('click', () => {
            this.trackEvent('Todoist Connect Clicked', {
                button_type: 'todoist_connect',
                source: 'tasks_modal',
                user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                conversion_funnel: 'integration_interest'
            });
            window.location.href = '/api/todoist-auth-start';
        });

        disconnectBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/todoist-disconnect', { method: 'POST' });
            } catch (_) {}
            statusText.textContent = 'Disconnected';
            fetchBtn.style.display = 'none';
            disconnectBtn.style.display = 'none';
            connectBtn.style.display = '';
            this.todoistTasks = [];
            this.todoistProjectsById = {};
            renderTasks();
        });

        fetchBtn.addEventListener('click', async () => {
            await this.fetchTodoistData();
            renderTasks();
        });

        // Check connection status and update UI
        (async () => {
            try {
                const resp = await fetch('/api/todoist-status');
                const json = await resp.json();
                const connected = !!json.connected;
                if (connected) {
                    statusText.textContent = 'Connected to Todoist';
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = '';
                    fetchBtn.style.display = '';
                    this.fetchTodoistData().then(renderTasks).catch(() => renderTasks());
                } else {
                    statusText.textContent = 'Not connected';
                    connectBtn.style.display = '';
                    disconnectBtn.style.display = 'none';
                    fetchBtn.style.display = 'none';
                    renderTasks();
                }
            } catch (_) {
                statusText.textContent = 'Not connected';
                connectBtn.style.display = '';
                disconnectBtn.style.display = 'none';
                fetchBtn.style.display = 'none';
                renderTasks();
            }
        })();
    }
    showTaskListModal() {
        // Build modal for task list only (no integration controls)
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';

        // Check if user is authenticated and not Pro
        const isFreeUser = this.isAuthenticated && this.user && !this.isPremiumUser();
        const isGuest = !this.isAuthenticated || !this.user;

        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.innerHTML = `
            <button class="close-focus-stats-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="tasks-header">
                <h3>Tasks</h3>
                <p class="tasks-subtitle">Manage your focus tasks</p>
            </div>
            ${this.isAuthenticated && this.user && this.isPremiumUser() ? `
            <div class="add-task-section" style="margin-bottom: 12px;">
                <button class="import-task-btn" id="importTodoistMainBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    Import from Todoist
                </button>
            </div>
            ` : ''}
            
            <!-- Task Tabs -->
            <div class="task-tabs">
                <div class="task-tabs-left">
                    <button class="task-tab active" data-tab="todo">To-do</button>
                    <button class="task-tab" data-tab="done">Done</button>
                </div>
                <div class="task-tabs-right">
                    <button class="task-options-btn" id="taskOptionsBtn" title="Task options">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="19" cy="12" r="1"/>
                            <circle cx="5" cy="12" r="1"/>
                        </svg>
                    </button>
                    
                    <!-- Task Options Dropdown -->
                    <div class="task-options-dropdown" id="taskOptionsDropdown" style="display: none;">
                        <div class="task-options-menu">
                            <button class="task-option-item" id="clearAllTasksBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                                Clear All Tasks
                            </button>
                            <button class="task-option-item" id="clearDoneTasksBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="9 11 12 14 22 4"/>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                </svg>
                                Clear Done Tasks
                            </button>
                            
                        </div>
                    </div>
                </div>
            </div>
            
            ${isGuest ? `
                <div style="background: var(--onyx-dark, #064e3b); border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
                    <div style="flex-shrink: 0;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
                            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
                            <line x1="6" x2="6" y1="2" y2="4"/>
                            <line x1="10" x2="10" y1="2" y2="4"/>
                            <line x1="14" x2="14" y1="2" y2="4"/>
                        </svg>
                    </div>
                    <div style="flex: 1;">
                        <div style="color: white; font-weight: 600; font-size: 14px; margin-bottom: 4px;">Save your progress</div>
                        <div style="color: white; font-size: 13px; opacity: 0.95;">Sync your tasks and stats across all your devices</div>
                    </div>
                    <button id="guestTaskSignupBtn" style="background: white; color: var(--onyx-dark, #064e3b); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap; font-size: 13px;">Sign up</button>
                </div>
            ` : ''}
            <div id="todoistTasksList" class="tasks-list"></div>
            
            <!-- Add Task Form (initially hidden) -->
            <div id="addTaskForm" class="add-task-form" style="display: none;">
                <div class="form-group">
                    <label>What are you working on?</label>
                    <input type="text" id="taskDescription" placeholder="Enter task description" maxlength="100">
                </div>
                <div class="form-group">
                    <label>Sessions</label>
                    <div class="pomodoros-control">
                        <button class="pomodoros-btn" id="decreasePomodoros">-</button>
                        <input type="number" id="pomodorosCount" value="1" min="1" max="10">
                        <button class="pomodoros-btn" id="increasePomodoros">+</button>
                    </div>
                </div>
                <div class="form-actions">
                    <button id="deleteTask" title="Delete task" style="display:none; margin-right: auto; background: none; border: none; padding: 8px; color: rgba(255,255,255,0.6);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/>
                            <path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </button>
                    <button class="btn-secondary" id="cancelAddTask">Cancel</button>
                    <button class="btn-primary" id="saveTask">Save</button>
                </div>
            </div>
            
            <div class="add-task-section">
                <button class="add-task-btn" id="showAddTaskForm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14"/>
                        <path d="M5 12h14"/>
                    </svg>
                    Add Task
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
            // Update task distribution when modal is closed
            this.rebuildTaskQueue();
            this.updateCurrentTaskBanner();
            this.updateTaskButtonState();
            // Update current task display in timer
            this.updateCurrentTaskFromQueue();
        };

        modal.querySelector('.close-focus-stats-x').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Guest signup button from Todoist banner
        if (isGuest) {
            const guestTaskSignupBtn = modal.querySelector('#guestTaskSignupBtn');
            if (guestTaskSignupBtn) {
                guestTaskSignupBtn.addEventListener('click', () => {
                    close();
                    window.location.href = '/pricing';
                });
            }
        }

        const listEl = modal.querySelector('#todoistTasksList');
        let currentTab = 'todo'; // Default to todo tab

        const renderTasks = () => {
            listEl.innerHTML = '';
            const allTasks = this.getAllTasks();
            
            // Filter tasks based on current tab
            let filteredTasks = allTasks;
            if (currentTab === 'todo') {
                filteredTasks = allTasks.filter(task => !task.completed);
            } else if (currentTab === 'done') {
                filteredTasks = allTasks.filter(task => task.completed);
            }
            
            if (filteredTasks.length === 0) {
                // Show appropriate message based on current tab
                if (currentTab === 'done') {
                    listEl.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 12l2 2 4-4"/>
                                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                                </svg>
                            </div>
                            <div class="empty-text">No completed tasks yet</div>
                            <div class="empty-subtext">Complete some tasks to see them here</div>
                        </div>
                    `;
                } else {
                    // For todo tab, show empty list without message
                    listEl.innerHTML = '';
                }
                return;
            }
            
            // Apply saved task order
            const savedOrder = this.getTaskOrder();
            let orderedTasks = filteredTasks;
            
            if (savedOrder.length > 0) {
                // Create a map for quick lookup
                const taskMap = new Map(filteredTasks.map(task => [task.id, task]));
                
                // Sort by saved order
                orderedTasks = [];
                savedOrder.forEach(orderItem => {
                    if (taskMap.has(orderItem.id)) {
                        orderedTasks.push(taskMap.get(orderItem.id));
                        taskMap.delete(orderItem.id);
                    }
                });
                
                // Add any remaining tasks that weren't in the saved order
                taskMap.forEach(task => orderedTasks.push(task));
            }
            
            orderedTasks.forEach((task, index) => {
                const item = document.createElement('div');
                item.className = 'task-item';
                item.draggable = true;
                item.dataset.taskId = task.id;
                item.dataset.index = index;
                
                // Get task session config from localStorage
                const taskConfig = this.getTaskConfig(task.id);
                const sessions = taskConfig.sessions || 1;
                
                const completedSessions = taskConfig.completedSessions || 0;
                const totalSessions = taskConfig.sessions || 1;
                const isCompleted = task.completed || (completedSessions >= totalSessions);
                
                // Check if task should be disabled for Guest users
                const isGuest = !this.isAuthenticated || !this.user;
                const shouldDisableForGuest = isGuest && index >= 1; // Disable tasks 2+ for guests
                
                const itemContent = `
                    <div class="task-checkbox">
                        <input type="checkbox" id="task-${task.id}" ${isCompleted ? 'checked' : ''} ${shouldDisableForGuest ? 'disabled' : ''}>
                        <label for="task-${task.id}"></label>
                    </div>
                    <div class="task-content">
                        <div class="task-title" style="${shouldDisableForGuest ? 'opacity: 0.5;' : ''}">
                            ${task.content || '(untitled)'}
                            ${shouldDisableForGuest ? '<span style="font-size: 12px; margin-left: 8px;">(Sign up required)</span>' : ''}
                        </div>
                    </div>
                    <div class="task-progress">
                        <span class="progress-text" style="${shouldDisableForGuest ? 'opacity: 0.5;' : ''}">${completedSessions}/${totalSessions}</span>
                    </div>
                    ${!shouldDisableForGuest ? `
                    <div class="task-menu" data-task-id="${task.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="19" cy="12" r="1"/>
                            <circle cx="5" cy="12" r="1"/>
                        </svg>
                    </div>
                    ` : ''}
                `;
                
                item.innerHTML = itemContent;
                
                // Add disabled class for guest users
                if (shouldDisableForGuest) {
                    item.classList.add('disabled-for-guest');
                }
                
                // Set initial selected state
                if (taskConfig.selected) {
                    item.classList.add('selected');
                }
                
                listEl.appendChild(item);
            });
            
            // Add event listeners for checkboxes and session controls
            this.setupTaskEventListeners(modal);
            
            // Add drag and drop functionality
            this.setupDragAndDrop(modal);
        };

        // Setup menu event listener
        const menuBtn = modal.querySelector('.tasks-menu');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTaskMenu(modal);
            });
        }

        // Setup add task button
        const addTaskBtn = modal.querySelector('#showAddTaskForm');
        const addTaskForm = modal.querySelector('#addTaskForm');
        if (addTaskBtn && addTaskForm) {
            addTaskBtn.addEventListener('click', () => {
                this.trackEvent('Add Task Button Clicked', {
                    button_type: 'add_task',
                    source: 'tasks_modal',
                    user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                    task_count: this.getLocalTasks().length
                });
                // Check task limit BEFORE showing the form
                const currentTasks = this.getLocalTasks();
                
                // Define limits based on user type
                let taskLimit;
                if (!this.isAuthenticated) {
                    // Guest users: 1 task
                    taskLimit = 1;
                } else if (this.isAuthenticated && !this.isPro) {
                    // Free users: 5 tasks
                    taskLimit = 5;
                } else {
                    // Pro users: unlimited
                    taskLimit = Infinity;
                }
                
                if (currentTasks.length >= taskLimit) {
                    this.showTaskLimitModal();
                    return;
                }
                
                // Enter add mode
                this.editingTaskId = null;
                addTaskForm.style.display = 'block';
                addTaskBtn.disabled = true;
                // Reset fields for add mode
                const taskInput = addTaskForm.querySelector('#taskDescription');
                const pomodorosInput = addTaskForm.querySelector('#pomodorosCount');
                const deleteBtn = addTaskForm.querySelector('#deleteTask');
                const cancelBtn = addTaskForm.querySelector('#cancelAddTask');
                const saveBtn = addTaskForm.querySelector('#saveTask');
                if (taskInput) taskInput.value = '';
                if (pomodorosInput) pomodorosInput.value = '1';
                if (deleteBtn) deleteBtn.style.display = 'none';
                // First task UX: hide cancel if no tasks exist; also disable save until text
                try {
                    const count = (this.getAllTasks() || []).length;
                    if (cancelBtn) cancelBtn.style.display = count === 0 ? 'none' : '';
                    if (saveBtn) saveBtn.disabled = !taskInput || !taskInput.value.trim();
                } catch (_) {}
                if (taskInput) taskInput.focus();
            });
        }

        // Initial UI state: if no tasks, show form and disable button
        if (addTaskBtn && addTaskForm) {
            try {
                const initialTasks = this.getAllTasks();
                if (Array.isArray(initialTasks) && initialTasks.length === 0) {
                    addTaskForm.style.display = 'block';
                    addTaskBtn.disabled = true;
                    // First task: hide cancel, disable save until input
                    const cancelBtn0 = addTaskForm.querySelector('#cancelAddTask');
                    const saveBtn0 = addTaskForm.querySelector('#saveTask');
                    const taskInput0 = addTaskForm.querySelector('#taskDescription');
                    if (cancelBtn0) cancelBtn0.style.display = 'none';
                    if (saveBtn0) saveBtn0.disabled = true;
                    if (taskInput0) taskInput0.focus();
                } else {
                    addTaskForm.style.display = 'none';
                    addTaskBtn.disabled = false;
                    const cancelBtn0 = addTaskForm.querySelector('#cancelAddTask');
                    if (cancelBtn0) cancelBtn0.style.display = '';
                }
            } catch (_) {}
        }

        // Setup form controls
        this.setupAddTaskFormControls(modal, renderTasks);

        // Tab switching logic
        const setupTabs = () => {
            const tabs = modal.querySelectorAll('.task-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.trackEvent('Task Tab Clicked', {
                        button_type: 'task_tab',
                        tab_name: tab.dataset.tab,
                        source: 'tasks_modal'
                    });
                    // Remove active class from all tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    // Add active class to clicked tab
                    tab.classList.add('active');
                    // Update current tab
                    currentTab = tab.dataset.tab;
                    
                    // Show/hide add task elements based on current tab
                    const addTaskForm = modal.querySelector('#addTaskForm');
                    const addTaskBtn = modal.querySelector('#showAddTaskForm');
                    const addTaskSection = modal.querySelector('.add-task-section');
                    
                    if (currentTab === 'done') {
                        // Hide add task elements in Done tab
                        if (addTaskForm) addTaskForm.style.display = 'none';
                        if (addTaskSection) addTaskSection.style.display = 'none';
                    } else {
                        // Show add task elements in To-do tab
                        if (addTaskSection) addTaskSection.style.display = 'block';
                        
                        // Restore addTaskForm to its proper state based on whether there are tasks
                        if (addTaskForm && addTaskBtn) {
                            const tasks = this.getAllTasks();
                            if (Array.isArray(tasks) && tasks.length === 0) {
                                // No tasks: show form and disable button
                                addTaskForm.style.display = 'block';
                                addTaskBtn.disabled = true;
                            } else {
                                // Has tasks: hide form and enable button
                                addTaskForm.style.display = 'none';
                                addTaskBtn.disabled = false;
                            }
                        }
                    }
                    
                    // Re-render tasks
                    renderTasks();
                });
            });
        };

        // Load tasks (local + Todoist if authenticated)
        this.loadAllTasks();
        renderTasks();
        setupTabs();
        
        // Setup task options dropdown
        this.setupTaskOptions(modal, renderTasks);
        
        // Setup Import button (main button above tabs)
        const mainImportBtn = modal.querySelector('#importTodoistMainBtn');
        if (mainImportBtn) {
            mainImportBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Track Todoist import button click
                this.trackEvent('Todoist Import Clicked', {
                    button_type: 'todoist_import',
                    source: 'tasks_panel',
                    user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                    conversion_funnel: 'integration_interest'
                });
                
                try {
                    // Check if Todoist is connected first
                    const isConnected = await this.checkTodoistConnection();
                    if (!isConnected) {
                        // Show connection prompt and redirect to auth
                        this.showTodoistConnectionPrompt();
                        return;
                    }
                    // Show Todoist projects selection modal
                    await this.showTodoistProjectsModal();
                } catch (error) {
                    console.error('Error opening Todoist projects modal:', error);
                    alert('Error loading Todoist projects. Please try again.');
                }
            });
        }
    }

    setupAddTaskFormControls(modal, renderTasks) {
        const addTaskForm = modal.querySelector('#addTaskForm');
        const addTaskBtn = modal.querySelector('#showAddTaskForm');
        const cancelBtn = modal.querySelector('#cancelAddTask');
        const saveBtn = modal.querySelector('#saveTask');
        const deleteBtn = modal.querySelector('#deleteTask');
        const taskInput = modal.querySelector('#taskDescription');
        const pomodorosInput = modal.querySelector('#pomodorosCount');
        const decreaseBtn = modal.querySelector('#decreasePomodoros');
        const increaseBtn = modal.querySelector('#increasePomodoros');

        // Cancel button - hide form and show add button; exit edit mode if any
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // If there are no tasks, keep the form open and button disabled
                const tasks = this.getAllTasks();
                if (!tasks || tasks.length === 0) {
                    addTaskForm.style.display = 'block';
                    addTaskBtn.disabled = true;
                } else {
                    addTaskForm.style.display = 'none';
                    addTaskBtn.disabled = false;
                }
                // Clear form
                if (taskInput) taskInput.value = '';
                if (pomodorosInput) pomodorosInput.value = '1';
                // Exit edit mode
                this.editingTaskId = null;
                // Restore list and add-section
                const listEl = modal.querySelector('#todoistTasksList');
                const addSection = modal.querySelector('.add-task-section');
                if (listEl) listEl.style.display = '';
                if (addSection) addSection.style.display = '';
            });
        }

        // Delete button - only in edit mode
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (!this.editingTaskId) return;
                // Remove from local tasks
                const tasks = this.getLocalTasks().filter(t => t.id !== this.editingTaskId);
                this.setLocalTasks(tasks);
                // Remove any config for the task
                const configs = JSON.parse(localStorage.getItem('taskConfigs') || '{}');
                delete configs[this.editingTaskId];
                localStorage.setItem('taskConfigs', JSON.stringify(configs));
                // Reset state and UI
                this.editingTaskId = null;
                taskInput.value = '';
                pomodorosInput.value = '1';
                addTaskForm.style.display = 'none';
                addTaskBtn.disabled = false;
                // Restore list and add-section
                const listEl = modal.querySelector('#todoistTasksList');
                const addSection = modal.querySelector('.add-task-section');
                if (listEl) listEl.style.display = '';
                if (addSection) addSection.style.display = '';
                // Refresh list/banner/queue
                this.loadAllTasks();
                if (typeof renderTasks === 'function') renderTasks();
                this.updateCurrentTaskBanner();
                this.rebuildTaskQueue();
                this.updateCurrentTaskFromQueue();
                this.updateDisplay();
            });
        }

        // Save button - add or update task and hide form
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const description = taskInput ? taskInput.value.trim() : '';
                const pomodoros = pomodorosInput ? parseInt(pomodorosInput.value) : 1;
                
                if (description) {
                    if (this.editingTaskId) {
                        // Update existing task
                        const tasks = this.getLocalTasks();
                        const idx = tasks.findIndex(t => t.id === this.editingTaskId);
                        if (idx !== -1) {
                            tasks[idx].content = description;
                            this.setLocalTasks(tasks);
                            this.setTaskConfig(this.editingTaskId, { sessions: pomodoros });
                        }
                        this.editingTaskId = null;
                        // Restore list and add-section
                        const listEl = modal.querySelector('#todoistTasksList');
                        const addSection = modal.querySelector('.add-task-section');
                        if (listEl) listEl.style.display = '';
                        if (addSection) addSection.style.display = '';
                    } else {
                        // Create new task
                        this.addLocalTask(description, pomodoros);
                    }
                    // Clear form
                    taskInput.value = '';
                    pomodorosInput.value = '1';
                    // Refresh task list
                    this.loadAllTasks();
                    if (typeof renderTasks === 'function') renderTasks();
                    // Update header to reflect changes immediately
                    this.updateCurrentTaskFromQueue();
                    this.updateSessionInfo();
                    // Enable button now that there is at least one task, and hide form
                    addTaskForm.style.display = 'none';
                    addTaskBtn.disabled = false;
                }
            });
        }

        // Pomodoros controls
        if (decreaseBtn && pomodorosInput) {
            decreaseBtn.addEventListener('click', () => {
                const current = parseInt(pomodorosInput.value);
                if (current > 1) {
                    pomodorosInput.value = current - 1;
                }
            });
        }

        if (increaseBtn && pomodorosInput) {
            increaseBtn.addEventListener('click', () => {
                const current = parseInt(pomodorosInput.value);
                if (current < 10) {
                    pomodorosInput.value = current + 1;
                }
            });
        }

        // Enter key to save
        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && saveBtn) {
                    saveBtn.click();
                }
            });
            // Enable/disable save based on input text
            taskInput.addEventListener('input', () => {
                if (saveBtn) {
                    saveBtn.disabled = !taskInput.value.trim();
                }
            });
        }
    }

    setupAddTaskFormControlsForPanel(panel, renderTasks) {
        const addTaskForm = panel.querySelector('#addTaskForm');
        const addTaskBtn = panel.querySelector('#showAddTaskForm');
        const cancelBtn = panel.querySelector('#cancelAddTask');
        const saveBtn = panel.querySelector('#saveTask');
        const deleteBtn = panel.querySelector('#deleteTask');
        const taskInput = panel.querySelector('#taskDescription');
        const pomodorosInput = panel.querySelector('#pomodorosCount');
        const decreaseBtn = panel.querySelector('#decreasePomodoros');
        const increaseBtn = panel.querySelector('#increasePomodoros');

        // Remove old event listeners by cloning
        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.replaceWith(newCancelBtn);
            newCancelBtn.addEventListener('click', () => {
                // Show back the hidden task item if we were editing
                if (this.editingTaskId) {
                    const hiddenTaskItem = panel.querySelector(`[data-task-id="${this.editingTaskId}"]`);
                    if (hiddenTaskItem) {
                        hiddenTaskItem.style.display = '';
                    }
                }
                
                const tasks = this.getAllTasks();
                if (!tasks || tasks.length === 0) {
                    addTaskForm.style.display = 'block';
                    addTaskBtn.disabled = true;
                } else {
                    addTaskForm.style.display = 'none';
                    addTaskBtn.disabled = false;
                }
                if (taskInput) taskInput.value = '';
                if (pomodorosInput) pomodorosInput.value = '1';
                this.editingTaskId = null;
                const listEl = panel.querySelector('#todoistTasksList');
                const addSection = panel.querySelector('.add-task-section');
                if (listEl) listEl.style.display = '';
                if (addSection) addSection.style.display = '';
            });
        }

        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.replaceWith(newDeleteBtn);
            newDeleteBtn.addEventListener('click', () => {
                if (!this.editingTaskId) return;
                const tasks = this.getLocalTasks().filter(t => t.id !== this.editingTaskId);
                this.setLocalTasks(tasks);
                const configs = JSON.parse(localStorage.getItem('taskConfigs') || '{}');
                delete configs[this.editingTaskId];
                localStorage.setItem('taskConfigs', JSON.stringify(configs));
                this.editingTaskId = null;
                if (taskInput) taskInput.value = '';
                if (pomodorosInput) pomodorosInput.value = '1';
                addTaskForm.style.display = 'none';
                addTaskBtn.disabled = false;
                const listEl = panel.querySelector('#todoistTasksList');
                const addSection = panel.querySelector('.add-task-section');
                if (listEl) listEl.style.display = '';
                if (addSection) addSection.style.display = '';
                this.loadAllTasks();
                if (typeof renderTasks === 'function') renderTasks();
                this.updateCurrentTaskBanner();
                this.rebuildTaskQueue();
                this.updateCurrentTaskFromQueue();
                this.updateDisplay();
            });
        }

        if (saveBtn) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.replaceWith(newSaveBtn);
            newSaveBtn.addEventListener('click', () => {
                console.log('💾 Save button clicked');
                const finalTaskInput = panel.querySelector('#taskDescription');
                const finalPomodorosInput = panel.querySelector('#pomodorosCount');
                const description = finalTaskInput ? finalTaskInput.value.trim() : '';
                const pomodoros = finalPomodorosInput ? parseInt(finalPomodorosInput.value) : 1;
                
                console.log('💾 Task description:', description, 'Pomodoros:', pomodoros);
                
                if (description) {
                    if (this.editingTaskId) {
                        console.log('💾 Editing task:', this.editingTaskId);
                        const tasks = this.getLocalTasks();
                        const idx = tasks.findIndex(t => t.id === this.editingTaskId);
                        if (idx !== -1) {
                            tasks[idx].content = description;
                            this.setLocalTasks(tasks);
                            this.setTaskConfig(this.editingTaskId, { sessions: pomodoros });
                        }
                        this.editingTaskId = null;
                    } else {
                        console.log('💾 Adding new task');
                        // Create new task
                        this.addLocalTask(description, pomodoros);
                    }
                    if (finalTaskInput) finalTaskInput.value = '';
                    if (finalPomodorosInput) finalPomodorosInput.value = '1';
                    this.loadAllTasks();
                    if (typeof renderTasks === 'function') {
                        console.log('💾 Calling renderTasks');
                        renderTasks();
                    }
                    this.updateCurrentTaskFromQueue();
                    this.updateSessionInfo();
                    addTaskForm.style.display = 'none';
                    addTaskBtn.disabled = false;
                    console.log('💾 Task saved successfully');
                } else {
                    console.warn('⚠️ No description provided');
                }
            });
        }

        if (decreaseBtn && pomodorosInput) {
            const newDecreaseBtn = decreaseBtn.cloneNode(true);
            decreaseBtn.replaceWith(newDecreaseBtn);
            newDecreaseBtn.addEventListener('click', () => {
                const current = parseInt(pomodorosInput.value);
                if (current > 1) {
                    pomodorosInput.value = current - 1;
                }
            });
        }

        if (increaseBtn && pomodorosInput) {
            const newIncreaseBtn = increaseBtn.cloneNode(true);
            increaseBtn.replaceWith(newIncreaseBtn);
            newIncreaseBtn.addEventListener('click', () => {
                const current = parseInt(pomodorosInput.value);
                if (current < 10) {
                    pomodorosInput.value = current + 1;
                }
            });
        }

        if (taskInput) {
            const newTaskInput = taskInput.cloneNode(true);
            taskInput.replaceWith(newTaskInput);
            
            // Get fresh references after all replacements
            const finalTaskInput = panel.querySelector('#taskDescription');
            const finalSaveBtn = panel.querySelector('#saveTask');
            
            if (finalTaskInput && finalSaveBtn) {
                finalTaskInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        finalSaveBtn.click();
                    }
                });
                
                finalTaskInput.addEventListener('input', () => {
                    finalSaveBtn.disabled = !finalTaskInput.value.trim();
                });
                
                // Set initial state
                finalSaveBtn.disabled = !finalTaskInput.value.trim();
            }
        }
    }

    setupTaskOptions(modal, renderTasks) {
        const optionsBtn = modal.querySelector('#taskOptionsBtn');
        const optionsDropdown = modal.querySelector('#taskOptionsDropdown');
        const clearAllBtn = modal.querySelector('#clearAllTasksBtn');
        const clearDoneBtn = modal.querySelector('#clearDoneTasksBtn');
        const importBtn = null; // removed menu import button

        if (!optionsBtn || !optionsDropdown) return;

        // Toggle dropdown visibility
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = optionsDropdown.style.display !== 'none';
            optionsDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Close dropdown when clicking anywhere in the modal (except on button/dropdown)
        const closeDropdownOnClick = (e) => {
            // Don't close if clicking on the options button or dropdown
            if (optionsBtn.contains(e.target) || optionsDropdown.contains(e.target)) {
                return;
            }
            // Close if clicking anywhere in the modal
            if (modal.contains(e.target)) {
                optionsDropdown.style.display = 'none';
            }
        };
        
        modal.addEventListener('click', closeDropdownOnClick);

        // Clear all tasks
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.trackEvent('Clear All Tasks Clicked', {
                    button_type: 'clear_all_tasks',
                    source: 'tasks_modal'
                });
                if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
                    // Clear local tasks
                    this.setLocalTasks([]);
                    // Clear task configs
                    localStorage.removeItem('taskConfigs');
                    // Clear task order
                    localStorage.removeItem('taskOrder');
                    // Refresh UI
                    this.loadAllTasks();
                    renderTasks();
                    this.updateCurrentTaskBanner();
                    this.rebuildTaskQueue();
                    // Close dropdown
                    optionsDropdown.style.display = 'none';
                }
            });
        }

        // Clear done tasks
        if (clearDoneBtn) {
            clearDoneBtn.addEventListener('click', () => {
                this.trackEvent('Clear Done Tasks Clicked', {
                    button_type: 'clear_done_tasks',
                    source: 'tasks_modal'
                });
                if (confirm('Are you sure you want to clear all completed tasks?')) {
                    const allTasks = this.getAllTasks();
                    const activeTasks = allTasks.filter(task => !task.completed);
                    this.setLocalTasks(activeTasks);
                    // Refresh UI
                    this.loadAllTasks();
                    renderTasks();
                    this.updateCurrentTaskBanner();
                    this.rebuildTaskQueue();
                    // Close dropdown
                    optionsDropdown.style.display = 'none';
                }
            });
        }

        // Import from Todoist
        // no import item in dropdown anymore
    }

    async checkTodoistConnection() {
        try {
            const resp = await fetch('/api/todoist-status');
            const json = await resp.json();
            return !!json.connected;
        } catch (error) {
            console.error('Error checking Todoist connection:', error);
            return false;
        }
    }


    async showTodoistProjectsModal() {
        // Create overlay (ensure on top of Tasks modal)
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '100001';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.style.maxWidth = '600px';
        modal.innerHTML = `
            <button class="close-focus-stats-x" id="closeTodoistProjectsModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="tasks-header">
                <h3>Import Tasks from Todoist</h3>
                <p class="tasks-subtitle">Select tasks to import from your Todoist projects</p>
            </div>
            
            <div class="todoist-projects-container">
                <div class="loading-state" id="todoistImportLoadingState">
                    <div class="loading-spinner"></div>
                    <p>Loading your Todoist tasks...</p>
                </div>
                <div class="todoist-tasks-list" id="todoistImportTasksList" style="display: none;">
                    <!-- Tasks will be loaded here -->
                </div>
            </div>
            
            <div class="todoist-import-actions" id="todoistImportActions" style="display: none;">
                <button class="btn-secondary" id="clearTodoistSelection">Clear Selection</button>
                <button class="btn-primary" id="importSelectedTasks">Import Selected</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close modal function
        const closeModal = () => {
            try {
                document.body.removeChild(overlay);
            } catch (_) {}
        };

        // Event listeners
        const closeBtn = modal.querySelector('#closeTodoistProjectsModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Close on overlay click (but not when clicking inside modal)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Load Todoist tasks
        try {
            await this.loadTodoistTasks(modal);
        } catch (error) {
            console.error('Error loading Todoist tasks:', error);
            // Show error state
            const tasksList = modal.querySelector('#todoistTasksList');
            const loadingState = modal.querySelector('#todoistLoadingState');
            if (loadingState) loadingState.style.display = 'none';
            if (tasksList) {
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <div class="empty-text">Error loading tasks</div>
                        <div class="empty-subtext">Please check your Todoist connection and try again</div>
                    </div>
                `;
                tasksList.style.display = 'block';
            }
        }
    }
    async loadTodoistTasks(modal) {
        const loadingState = modal.querySelector('#todoistImportLoadingState');
        const tasksList = modal.querySelector('#todoistImportTasksList');
        const importActions = modal.querySelector('#todoistImportActions');
        
        try {
            // Build query params (Developer Mode + uid) just like other flows
            const viewMode = localStorage.getItem('viewMode');
            const userId = window.Clerk?.user?.id || '';
            const params = new URLSearchParams();
            if (viewMode === 'pro') {
                params.append('devMode', 'pro');
                params.append('bypass', 'true');
            }
            if (userId) params.append('uid', userId);
            const qs = params.toString() ? `?${params.toString()}` : '';

            // Fetch both tasks and projects
            const [tasksResponse, projectsResponse] = await Promise.all([
                fetch(`/api/todoist-tasks${qs}`),
                fetch(`/api/todoist-projects${qs}`)
            ]);

            if (!tasksResponse.ok || !projectsResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const tasks = await tasksResponse.json();
            const projects = await projectsResponse.json();
            
            // Create project ID to name mapping
            const projectMap = {};
            projects.forEach(project => {
                projectMap[project.id] = project.name;
            });
            
            // Add project_name to each task
            tasks.forEach(task => {
                task.project_name = projectMap[task.project_id] || 'Inbox';
            });
            
            // Hide loading state
            if (loadingState) loadingState.style.display = 'none';
            
            if (tasks.length === 0) {
                // Show empty state
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
                            </svg>
                        </div>
                        <div class="empty-text">No tasks found</div>
                        <div class="empty-subtext">Create some tasks in Todoist to import them</div>
                    </div>
                `;
            } else {
                // Group tasks by project
                const tasksByProject = this.groupTasksByProject(tasks);
                
                // Render tasks grouped by project
                    const projectEntries = Object.entries(tasksByProject);
                    
                    // Sort projects: Inbox first, then others alphabetically
                    const sortedProjects = projectEntries.sort(([nameA], [nameB]) => {
                        if (nameA === 'Inbox') return -1;
                        if (nameB === 'Inbox') return 1;
                        return nameA.localeCompare(nameB);
                    });
                    
                    tasksList.innerHTML = sortedProjects.map(([projectName, projectTasks]) => {
                        const isInbox = projectName === 'Inbox';
                        return `
                            <div class="todoist-project-section ${isInbox ? 'inbox-section' : ''}">
                                <div class="project-header">
                                    <h4 class="project-title">${isInbox ? '📥 Inbox' : projectName}</h4>
                                    <span class="project-task-count">${projectTasks.length} task${projectTasks.length > 1 ? 's' : ''}</span>
                                </div>
                                <div class="project-tasks">
                                    ${projectTasks.map(task => `
                                        <div class="todoist-task-item" data-task-id="${task.id}">
                                            <div class="task-checkbox">
                                                <input type="checkbox" id="task-${task.id}" class="task-checkbox-input">
                                                <label for="task-${task.id}" class="task-checkbox-label"></label>
                                            </div>
                                            <div class="task-info">
                                                <div class="task-content">${task.content}</div>
                                                ${task.due ? `<div class="task-due">Due: ${new Date(task.due.date).toLocaleDateString()}</div>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('');
            }
            
            tasksList.style.display = 'block';
            importActions.style.display = 'flex';
            
            // Setup task selection handlers
            this.setupTodoistTaskSelection(modal);
            
        } catch (error) {
            console.error('Error loading Todoist tasks:', error);
            throw error;
        }
    }

    groupTasksByProject(tasks) {
        const grouped = {};
        
        tasks.forEach(task => {
            // Use project_name if available, otherwise use 'Inbox'
            const projectName = task.project_name || 'Inbox';
            
            if (!grouped[projectName]) {
                grouped[projectName] = [];
            }
            grouped[projectName].push(task);
        });
        
        return grouped;
    }

    setupTodoistTaskSelection(modal) {
        const taskItems = modal.querySelectorAll('.todoist-task-item');
        const clearSelectionBtn = modal.querySelector('#clearTodoistSelection');
        const importBtn = modal.querySelector('#importSelectedTasks');
        
        // Handle task selection
        taskItems.forEach(item => {
            const checkbox = item.querySelector('.task-checkbox-input');
            if (checkbox) {
                // Toggle checkbox when clicking anywhere on the task item
                item.addEventListener('click', (e) => {
                    // Don't toggle if clicking directly on the checkbox or label (let native behavior handle it)
                    if (e.target === checkbox || e.target.classList.contains('task-checkbox-label')) {
                        return;
                    }
                    checkbox.checked = !checkbox.checked;
                    item.classList.toggle('selected', checkbox.checked);
                    this.updateTodoistImportButton(modal);
                });
                
                // Also handle native checkbox change
                checkbox.addEventListener('change', () => {
                    item.classList.toggle('selected', checkbox.checked);
                    this.updateTodoistImportButton(modal);
                });
            }
        });

        // Clear selection
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                taskItems.forEach(item => {
                    const checkbox = item.querySelector('.task-checkbox-input');
                    if (checkbox) {
                        checkbox.checked = false;
                        item.classList.remove('selected');
                    }
                });
                this.updateTodoistImportButton(modal);
            });
        }

        // Import selected tasks
        if (importBtn) {
            importBtn.addEventListener('click', async () => {
                const selectedTasks = Array.from(taskItems)
                    .filter(item => item.classList.contains('selected'))
                    .map(item => ({
                        id: item.dataset.taskId,
                        content: item.querySelector('.task-content').textContent
                    }));

                if (selectedTasks.length === 0) {
                    alert('Please select at least one task to import.');
                    return;
                }

                try {
                    await this.importTodoistTasks(selectedTasks);
                    // Close modal
                    const overlay = modal.closest('.focus-stats-overlay');
                    if (overlay) {
                        document.body.removeChild(overlay);
                    }
                } catch (error) {
                    console.error('Error importing tasks:', error);
                    alert('Error importing tasks. Please try again.');
                }
            });
        }
    }

    updateTodoistImportButton(modal) {
        const importBtn = modal.querySelector('#importSelectedTasks');
        const selectedCount = modal.querySelectorAll('.todoist-task-item.selected').length;
        
        if (importBtn) {
            if (selectedCount > 0) {
                importBtn.textContent = `Import ${selectedCount} Task${selectedCount > 1 ? 's' : ''}`;
                importBtn.disabled = false;
            } else {
                importBtn.textContent = 'Import Selected';
                importBtn.disabled = true;
            }
        }
    }

    async importTodoistTasks(selectedTasks) {
        try {
            // Add selected tasks to local tasks
            const localTasks = this.getLocalTasks();
            const newTasks = selectedTasks.map(task => ({
                id: `todoist_${task.id}`,
                content: task.content,
                completed: false,
                source: 'todoist'
            }));
            
            // Add new tasks to existing local tasks
            this.setLocalTasks([...localTasks, ...newTasks]);
            
            // Set task config for each new task (selected by default)
            newTasks.forEach(task => {
                this.setTaskConfig(task.id, { 
                    sessions: 1, 
                    selected: true, 
                    completedSessions: 0 
                });
            });
            
            // Refresh the task list
            this.loadAllTasks();
            this.updateCurrentTaskBanner();
            this.rebuildTaskQueue();
            
            // Refresh task modal if it's open
            this.refreshTaskModalIfOpen();
            
        } catch (error) {
            console.error('Error importing Todoist tasks:', error);
            throw error;
        }
    }

    // Show integration upgrade modal for Guest and Free users - Dynamic modal like showTaskListModal
    showIntegrationUpgradeModal(integrationType) {
        const integrationData = {
            todoist: {
                title: 'Todoist Integration',
                subtitle: 'Sync your tasks seamlessly',
                icon: '/images/todoist.svg',
                benefits: [
                    'Import tasks from Todoist projects',
                    'Two-way sync keeps everything updated',
                    'Focus on tasks with Pomodoro timer',
                    'Track productivity across platforms'
                ]
            },
            notion: {
                title: 'Notion Integration',
                subtitle: 'Connect your workspace',
                icon: '/images/notion.svg',
                benefits: [
                    'Import tasks from Notion databases',
                    'Keep your workflow centralized',
                    'Sync task progress automatically',
                    'Boost productivity with seamless integration'
                ]
            },
        };
        
        const data = integrationData[integrationType];
        if (!data) return;
        
        // Determine user type and message
        const isGuest = !this.isAuthenticated || !this.user;
        const isFree = this.isAuthenticated && this.user && !this.isPro;
        
        let upgradeMessage, buttonText;
        if (isGuest) {
            upgradeMessage = 'Sign up to unlock integrations and sync your tasks seamlessly!';
            buttonText = 'Sign up';
        } else if (isFree) {
            upgradeMessage = 'Upgrade to Pro to unlock integrations and sync your tasks seamlessly!';
            buttonText = 'Upgrade to Pro';
        } else {
            upgradeMessage = 'Upgrade to Pro to unlock integrations and sync your tasks seamlessly!';
            buttonText = 'Upgrade to Pro';
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.style.maxWidth = '500px';
        modal.innerHTML = `
            <button class="close-focus-stats-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="margin-bottom: 16px; display: flex; justify-content: center;">
                    <div style="background: white; border-radius: 12px; padding: 12px; display: inline-flex; align-items: center; justify-content: center;">
                        <img src="${data.icon}" alt="${data.title}" style="width: 64px; height: 64px; display: block;">
                    </div>
                </div>
                <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 8px; color: white;">${data.title}</h3>
                <p style="color: rgba(255,255,255,0.7); font-size: 14px;">${data.subtitle}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                ${data.benefits.map(benefit => `
                    <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span style="color: rgba(255,255,255,0.9); font-size: 14px;">${benefit}</span>
                    </div>
                `).join('')}
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
                <p style="color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.5;">${upgradeMessage}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="btn-primary" id="integrationSignupBtn" style="width: 100%;">${buttonText}</button>
                <button class="btn-secondary" id="integrationCancelBtn" style="width: 100%;">Cancel</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
        };
        
        // Close handlers
        modal.querySelector('.close-focus-stats-x').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        
        // Button handlers
        modal.querySelector('#integrationCancelBtn').addEventListener('click', close);
        modal.querySelector('#integrationSignupBtn').addEventListener('click', () => {
            if (isGuest) {
                // Guest user - show signup
                this.handleSignup();
            } else {
                // Free user - redirect to pricing page
                window.location.href = '/pricing';
            }
        });
    }

    // Wrapper functions for integration buttons
    async showTodoistProjects() {
        console.log('🔍 Todoist click - Auth state:', {
            isAuthenticated: this.isAuthenticated,
            hasUser: !!this.user,
            isPro: this.isPro,
            isPremiumUser: this.isPremiumUser()
        });
        
        // Check if user is Pro (double check with isPremiumUser)
        const isProUser = this.isAuthenticated && this.user && (this.isPro || this.isPremiumUser());
        
        if (isProUser) {
            // Pro users can access integrations
            try {
                // Check if Todoist is connected first
                const isConnected = await this.checkTodoistConnection();
                console.log('🔍 Todoist connection status:', isConnected);
                
                if (!isConnected) {
                    // Pro user not connected → redirect to auth (same as Settings Connect button)
                    console.log('🔗 Redirecting to Todoist auth...');
                    window.location.href = '/api/todoist-auth-start';
                    return;
                }
                // Pro user connected → show projects modal
                console.log('📋 Showing Todoist projects modal...');
                await this.showTodoistProjectsModal();
            } catch (error) {
                console.error('Error opening Todoist projects modal:', error);
                alert('Error loading Todoist projects. Please try again.');
            }
        } else {
            // Guest and Free users show integration modal
            console.log('💰 Showing integration modal for non-Pro user');
            this.showIntegrationModal('todoist');
        }
    }
    
    showNotionIntegration() {
        // Check if user is Pro
        if (this.isAuthenticated && this.user && this.isPro) {
            // Pro users can access integrations
            // Check if already connected
            fetch('/api/notion-status')
                .then(res => res.json())
                .then(data => {
                if (data.connected) {
                    // Already connected, show import modal
                    this.showNotionPagesModal();
                } else {
                    // Not connected, initiate connection
                    const userId = window.Clerk?.user?.id || '';
                    const viewMode = localStorage.getItem('viewMode');
                    const devModeParam = viewMode === 'pro' ? '&devMode=pro' : '';
                    window.location.href = `/api/notion-auth-start?uid=${encodeURIComponent(userId)}${devModeParam}`;
                }
            })
            .catch(() => {
                alert('Error checking Notion connection. Please try again.');
            });
        } else {
            // Guest and Free users show integration modal
            this.showIntegrationModal('notion');
        }
    }
    
    async showNotionPagesModal() {
        // Create overlay (ensure on top of Tasks modal)
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '100001';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.style.maxWidth = '600px';
        modal.innerHTML = `
            <button class="close-focus-stats-x" id="closeNotionPagesModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="tasks-header">
                <h3>Import Tasks from Notion</h3>
                <p class="tasks-subtitle">Select pages to import as tasks</p>
            </div>
            
            <div class="todoist-projects-container">
                <div class="loading-state" id="notionImportLoadingState">
                    <div class="loading-spinner"></div>
                    <p>Loading your Notion pages...</p>
                </div>
                <div class="todoist-tasks-list" id="notionImportPagesList" style="display: none;">
                    <!-- Pages will be loaded here -->
                </div>
            </div>
            
            <div class="todoist-import-actions" id="notionImportActions" style="display: none;">
                <button class="btn-secondary" id="clearNotionSelection">Clear Selection</button>
                <button class="btn-primary" id="importSelectedPages">Import Selected</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close modal function
        const closeModal = () => {
            try {
                document.body.removeChild(overlay);
            } catch (_) {}
        };

        // Event listeners
        const closeBtn = modal.querySelector('#closeNotionPagesModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Close on overlay click (but not when clicking inside modal)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Load Notion pages
        try {
            await this.loadNotionPages(modal);
        } catch (error) {
            console.error('Error loading Notion pages:', error);
            // Show error state
            const pagesList = modal.querySelector('#notionImportPagesList');
            const loadingState = modal.querySelector('#notionImportLoadingState');
            if (loadingState) loadingState.style.display = 'none';
            if (pagesList) {
                pagesList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <div class="empty-text">Error loading pages</div>
                        <div class="empty-subtext">Please check your Notion connection and try again</div>
                    </div>
                `;
                pagesList.style.display = 'block';
            }
        }
    }
    
    async loadNotionPages(modal) {
        const loadingState = modal.querySelector('#notionImportLoadingState');
        const pagesList = modal.querySelector('#notionImportPagesList');
        const importActions = modal.querySelector('#notionImportActions');
        
        try {
            // Build query params (Developer Mode + uid) - define qs at the beginning
            const viewMode = localStorage.getItem('viewMode');
            const userId = window.Clerk?.user?.id || '';
            const params = new URLSearchParams();
            if (viewMode === 'pro') {
                params.append('devMode', 'pro');
                params.append('bypass', 'true');
            }
            if (userId) params.append('uid', userId);
            const qs = params.toString() ? `?${params.toString()}` : '';

            // Check if we have cached databases
            const cacheKey = 'notion_databases_cache';
            const cachedData = localStorage.getItem(cacheKey);
            const cacheTime = localStorage.getItem(cacheKey + '_time');
            const now = Date.now();
            const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
            
            let databases;
            
            // Use cache if it's fresh (less than 2 minutes old)
            if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
                databases = JSON.parse(cachedData);
                console.log('Using cached Notion databases');
                // Skip loading state for cached data
                if (loadingState) loadingState.style.display = 'none';
            } else {
                // Fetch databases from Notion
                const response = await fetch(`/api/notion-pages${qs}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch Notion databases');
                }

                databases = await response.json();
                
                // Cache the results
                localStorage.setItem(cacheKey, JSON.stringify(databases));
                localStorage.setItem(cacheKey + '_time', now.toString());
            }
            
            // Hide loading state
            if (loadingState) loadingState.style.display = 'none';
        
            if (databases.length === 0) {
                // Show empty state
                pagesList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
                            </svg>
                        </div>
                        <div class="empty-text">No databases found</div>
                        <div class="empty-subtext">Create a database in Notion to import tasks</div>
                    </div>
                `;
            } else {
                // Render databases as clickable items
                pagesList.innerHTML = `
                    <div class="notion-database-list">
                        <div class="notion-instruction">Select a database to view its tasks:</div>
                        ${databases.map(db => `
                            <div class="notion-database-item" data-database-id="${db.id}">
                                <div class="database-info">
                                    <div class="database-name">${db.name}</div>
                                    <div class="database-meta">
                                        ${db.hasCheckbox ? '<span class="db-feature">✓ Checkbox</span>' : ''}
                                        ${db.hasStatus ? '<span class="db-feature">📊 Status</span>' : ''}
                                    </div>
                                </div>
                                <svg class="chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Setup database selection
                this.setupNotionDatabaseSelection(modal, databases, qs);
            }
        
            pagesList.style.display = 'block';
        
        } catch (error) {
            console.error('Error in loadNotionPages:', error);
            throw error;
        }
    }
    
    setupNotionDatabaseSelection(modal, databases, qs) {
        const databaseItems = modal.querySelectorAll('.notion-database-item');
        
        databaseItems.forEach(item => {
            item.addEventListener('click', async () => {
                const databaseId = item.dataset.databaseId;
                const database = databases.find(db => db.id === databaseId);
                
                if (!database) return;
                
                // Load tasks from this database
                await this.loadNotionDatabaseItems(modal, database, qs);
            });
        });
    }
    
    async loadNotionDatabaseItems(modal, database, qs) {
        const pagesList = modal.querySelector('#notionImportPagesList');
        const importActions = modal.querySelector('#notionImportActions');
        
        try {
            // Show loading
            pagesList.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading tasks...</div>
                </div>
            `;
            
            // Fetch items from the database
            const response = await fetch(`/api/notion-database-items?databaseId=${database.id}&${qs}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch database items');
            }
            
            const items = await response.json();
            
            // Filter out completed items (only show incomplete tasks)
            const incompleteTasks = items.filter(item => !item.completed);
            
            if (incompleteTasks.length === 0) {
                pagesList.innerHTML = `
                    <div class="empty-state">
                        <div class="back-button" onclick="window.pomodoroTimer.loadNotionPages(this.closest('.focus-stats-modal'))">
                            ← Back to Databases
                        </div>
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
                            </svg>
                        </div>
                        <div class="empty-text">No incomplete tasks</div>
                        <div class="empty-subtext">All tasks in this database are completed</div>
                    </div>
                `;
                importActions.style.display = 'none';
            } else {
                // Render tasks
                pagesList.innerHTML = `
                    <div class="back-button" onclick="window.pomodoroTimer.loadNotionPages(this.closest('.focus-stats-modal'))">
                        ← Back to Databases
                    </div>
                    <div class="todoist-project-section">
                        <div class="project-header">
                            <h4 class="project-title">${database.name}</h4>
                            <span class="project-task-count">${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="project-tasks">
                            ${incompleteTasks.map(task => `
                                <div class="todoist-task-item" data-task-id="${task.id}" data-checkbox-property="${task.checkboxPropertyName || ''}" data-status-property="${task.statusPropertyName || ''}">
                                    <div class="task-checkbox">
                                        <input type="checkbox" id="notion-${task.id}" class="task-checkbox-input">
                                        <label for="notion-${task.id}" class="task-checkbox-label"></label>
                                    </div>
                                    <div class="task-info">
                                        <div class="task-content">${task.content}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                importActions.style.display = 'flex';
                
                // Setup task selection
                this.setupNotionTaskSelection(modal);
            }
            
        } catch (error) {
            console.error('Error loading database items:', error);
            pagesList.innerHTML = `
                <div class="empty-state">
                    <div class="back-button" onclick="window.pomodoroTimer.loadNotionPages(this.closest('.focus-stats-modal'))">
                        ← Back to Databases
                    </div>
                    <div class="empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <div class="empty-text">Error loading tasks</div>
                    <div class="empty-subtext">${error.message}</div>
                </div>
            `;
        }
    }
    
    setupNotionTaskSelection(modal) {
        const taskItems = modal.querySelectorAll('.todoist-task-item');
        const clearSelectionBtn = modal.querySelector('#clearNotionSelection');
        const importBtn = modal.querySelector('#importSelectedPages');
        
        // Handle task selection
        taskItems.forEach(item => {
            const checkbox = item.querySelector('.task-checkbox-input');
            if (checkbox) {
                // Only checkbox changes selection
                checkbox.addEventListener('change', () => {
                    item.classList.toggle('selected', checkbox.checked);
                    this.updateNotionImportButton(modal);
                });
            }
        });

        // Clear selection
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                taskItems.forEach(item => {
                    const checkbox = item.querySelector('.task-checkbox-input');
                    if (checkbox) {
                        checkbox.checked = false;
                        item.classList.remove('selected');
                    }
                });
                this.updateNotionImportButton(modal);
            });
        }

        // Import selected tasks
        if (importBtn) {
            importBtn.addEventListener('click', async () => {
                const selectedTasks = Array.from(taskItems)
                    .filter(item => item.querySelector('.task-checkbox-input')?.checked)
                    .map(item => {
                        const taskId = item.dataset.taskId;
                        const taskContent = item.querySelector('.task-content')?.textContent || '';
                        const checkboxProperty = item.dataset.checkboxProperty;
                        const statusProperty = item.dataset.statusProperty;
                        return { 
                            id: taskId, 
                            content: taskContent,
                            checkboxPropertyName: checkboxProperty,
                            statusPropertyName: statusProperty
                        };
                    });

                if (selectedTasks.length === 0) return;

                // Import tasks as local tasks with notion source
                const localTasks = this.getLocalTasks();
                const newTasks = selectedTasks.map(task => ({
                    id: `notion_${task.id}`,
                    content: task.content,
                    completed: false,
                    source: 'notion',
                    notionPageId: task.id,
                    checkboxPropertyName: task.checkboxPropertyName,
                    statusPropertyName: task.statusPropertyName
                }));
                
                this.setLocalTasks([...localTasks, ...newTasks]);

                // Close modal and refresh task list
                modal.style.display = 'none';
                this.refreshTaskModalIfOpen();

                // Show success message
                this.showNotification(`Imported ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} from Notion`);
            });
        }

        this.updateNotionImportButton(modal);
    }

    updateNotionImportButton(modal) {
        const importBtn = modal.querySelector('#importSelectedPages');
        const selectedCount = modal.querySelectorAll('.todoist-task-item.selected').length;
        
        if (importBtn) {
            if (selectedCount > 0) {
                importBtn.textContent = `Import ${selectedCount} Page${selectedCount > 1 ? 's' : ''}`;
                importBtn.disabled = false;
            } else {
                importBtn.textContent = 'Import Selected';
                importBtn.disabled = true;
            }
        }
    }

    async completeNotionTask(task, isCompleted) {
        try {
            // Build query params for Pro check
            const viewMode = localStorage.getItem('viewMode');
            const userId = window.Clerk?.user?.id || '';
            const params = new URLSearchParams();
            if (viewMode === 'pro') {
                params.append('devMode', 'pro');
                params.append('bypass', 'true');
            }
            if (userId) params.append('uid', userId);
            const qs = params.toString() ? `?${params.toString()}` : '';
            
            // Call the API to update the task in Notion
            const response = await fetch(`/api/notion-complete-task${qs}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pageId: task.notionPageId,
                    checkboxPropertyName: task.checkboxPropertyName,
                    statusPropertyName: task.statusPropertyName,
                    completed: isCompleted
                })
            });
            
            if (!response.ok) {
                console.error('Failed to update Notion task');
            }
        } catch (error) {
            console.error('Error completing Notion task:', error);
        }
    }
    
    showGoogleCalendarIntegration() {
        // Check if user is Pro
        if (this.isAuthenticated && this.user && this.isPro) {
            // Pro users can access integrations
        
        // Check if already connected
        fetch('/api/google-calendar-status')
            .then(res => res.json())
            .then(data => {
                if (data.connected) {
                    // Already connected
                    alert('Google Calendar is already connected! Manage it in Settings.');
                } else {
                    // Not connected, initiate connection
                    const userId = window.Clerk?.user?.id || '';
                    const viewMode = localStorage.getItem('viewMode');
                    const devModeParam = viewMode === 'pro' ? '&devMode=pro' : '';
                    window.location.href = `/api/google-calendar-auth-start?uid=${encodeURIComponent(userId)}${devModeParam}`;
                }
            })
            .catch(() => {
                alert('Error checking Google Calendar connection. Please try again.');
            });
        } else {
            // Guest and Free users go to pricing page
            window.location.href = '/pricing';
        }
    }

    refreshTaskModalIfOpen() {
        // Check if task sidebar panel is open
        const taskSidePanel = document.getElementById('taskSidePanel');
        if (taskSidePanel && taskSidePanel.classList.contains('open')) {
            console.log('🔄 Refreshing Task sidebar panel');
            // Get the tasks list element
            const listEl = taskSidePanel.querySelector('#todoistTasksList');
            if (listEl) {
                // Get current active tab
                const activeTabEl = taskSidePanel.querySelector('.task-tab.active');
                const currentTab = activeTabEl ? activeTabEl.dataset.tab : 'todo';
                
                // Clear only task items and headers, preserve the form
                const taskItems = listEl.querySelectorAll('.task-item, .empty-state, .task-source-header');
                taskItems.forEach(item => item.remove());
                
                const allTasks = this.getAllTasks();
                
                // Filter tasks based on current tab
                let filteredTasks = allTasks;
                if (currentTab === 'todo') {
                    filteredTasks = allTasks.filter(task => !task.completed);
                } else if (currentTab === 'done') {
                    filteredTasks = allTasks.filter(task => task.completed);
                }
                
                if (filteredTasks.length === 0) {
                    if (currentTab === 'done') {
                        const emptyState = document.createElement('div');
                        emptyState.className = 'empty-state';
                        emptyState.innerHTML = `
                            <div class="empty-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 12l2 2 4-4"/>
                                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                                </svg>
                            </div>
                            <div class="empty-text">No completed tasks yet</div>
                            <div class="empty-subtext">Complete some tasks to see them here</div>
                        `;
                        listEl.appendChild(emptyState);
                    }
                } else {
                    // Group tasks by source
                    const tasksBySource = {
                        'local': [],
                        'todoist': [],
                        'notion': []
                    };
                    
                    filteredTasks.forEach(task => {
                        const source = task.source || 'local';
                        if (tasksBySource[source]) {
                            tasksBySource[source].push(task);
                        } else {
                            tasksBySource['local'].push(task);
                        }
                    });
                    
                    // Apply saved task order within each source
                    const savedOrder = this.getTaskOrder();
                    Object.keys(tasksBySource).forEach(source => {
                        const tasks = tasksBySource[source];
                        if (savedOrder.length > 0 && tasks.length > 0) {
                            const taskMap = new Map(tasks.map(task => [task.id, task]));
                            const orderedTasks = [];
                            savedOrder.forEach(orderItem => {
                                if (taskMap.has(orderItem.id)) {
                                    orderedTasks.push(taskMap.get(orderItem.id));
                                    taskMap.delete(orderItem.id);
                                }
                            });
                            taskMap.forEach(task => orderedTasks.push(task));
                            tasksBySource[source] = orderedTasks;
                        }
                    });
                    
                    // Get the form element to insert before it (if it exists)
                    const addTaskFormEl = listEl.querySelector('#addTaskForm');
                    
                    // Source labels
                    const sourceConfig = {
                        'local': { label: 'My Tasks' },
                        'todoist': { label: 'From Todoist' },
                        'notion': { label: 'From Notion' }
                    };
                    
                    // Check how many sources have tasks
                    const sourcesWithTasks = Object.keys(tasksBySource).filter(source => tasksBySource[source].length > 0);
                    const showHeaders = sourcesWithTasks.length > 1 || (sourcesWithTasks.length === 1 && sourcesWithTasks[0] !== 'local');
                    
                    // Render tasks grouped by source
                    let globalIndex = 0;
                    ['local', 'todoist', 'notion'].forEach(source => {
                        const tasks = tasksBySource[source];
                        if (tasks.length === 0) return;
                        
                        // Create source header (only if needed)
                        if (showHeaders) {
                            const sourceHeader = document.createElement('div');
                            sourceHeader.className = 'task-source-header';
                            const config = sourceConfig[source];
                            sourceHeader.innerHTML = `
                                <span class="source-label">${config.label}</span>
                                <span class="source-count">${tasks.length}</span>
                            `;
                            
                            // Insert before the form if it exists, otherwise append
                            if (addTaskFormEl) {
                                listEl.insertBefore(sourceHeader, addTaskFormEl);
                            } else {
                                listEl.appendChild(sourceHeader);
                            }
                        }
                        
                        // Render tasks for this source
                        tasks.forEach((task) => {
                            const item = document.createElement('div');
                            item.className = 'task-item';
                            item.draggable = true;
                            item.dataset.taskId = task.id;
                            item.dataset.index = globalIndex++;
                            item.dataset.source = source;
                            
                            const taskConfig = this.getTaskConfig(task.id);
                            const completedSessions = taskConfig.completedSessions || 0;
                            const totalSessions = taskConfig.sessions || 1;
                            const isCompleted = task.completed || (completedSessions >= totalSessions);
                            
                            const itemContent = `
                                <div class="task-checkbox">
                                    <input type="checkbox" id="task-${task.id}" ${isCompleted ? 'checked' : ''}>
                                    <label for="task-${task.id}"></label>
                                </div>
                                <div class="task-content">
                                    <div class="task-title">
                                        ${task.content || '(untitled)'}
                                    </div>
                                </div>
                                <div class="task-progress">
                                    <span class="progress-text">${completedSessions}/${totalSessions}</span>
                                </div>
                                ${!isCompleted ? `
                                <div class="task-menu" data-task-id="${task.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="1"/>
                                        <circle cx="19" cy="12" r="1"/>
                                        <circle cx="5" cy="12" r="1"/>
                                    </svg>
                                </div>
                                ` : ''}
                            `;
                            
                            item.innerHTML = itemContent;
                            
                            // Add completed class if task is completed
                            if (isCompleted) {
                                item.classList.add('completed');
                            }
                            
                            // Only apply 'selected' class if task is NOT completed
                            if (taskConfig.selected && !isCompleted) {
                                item.classList.add('selected');
                            }
                            
                            // Insert before the form if it exists, otherwise append
                            if (addTaskFormEl) {
                                listEl.insertBefore(item, addTaskFormEl);
                            } else {
                                listEl.appendChild(item);
                            }
                        });
                    });
                    
                    // Re-setup event listeners after rendering
                    this.setupTaskEventListeners(taskSidePanel);
                    this.setupDragAndDrop(taskSidePanel);
                }
            }
            return;
        }
        
        // Check if task modal is currently open
        const taskModal = document.querySelector('.focus-stats-overlay');
        if (taskModal) {
            // Find the tasks list element
            const tasksList = taskModal.querySelector('#todoistTasksList');
            if (tasksList) {
                // Get current tab
                const activeTab = taskModal.querySelector('.task-tab.active');
                const currentTab = activeTab ? activeTab.dataset.tab : 'todo';
                
                // Re-render tasks for the current tab
                const allTasks = this.getAllTasks();
                let filteredTasks = allTasks;
                if (currentTab === 'todo') {
                    filteredTasks = allTasks.filter(task => !task.completed);
                } else if (currentTab === 'done') {
                    filteredTasks = allTasks.filter(task => task.completed);
                }
                
                if (filteredTasks.length === 0) {
                    if (currentTab === 'done') {
                        tasksList.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M9 12l2 2 4-4"/>
                                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                                    </svg>
                                </div>
                                <div class="empty-text">No completed tasks yet</div>
                                <div class="empty-subtext">Complete some tasks to see them here</div>
                            </div>
                        `;
                    } else {
                        tasksList.innerHTML = '';
                    }
                } else {
                    // Apply saved task order
                    const savedOrder = this.getTaskOrder();
                    let orderedTasks = filteredTasks;
                    
                    if (savedOrder.length > 0) {
                        const taskMap = new Map(filteredTasks.map(task => [task.id, task]));
                        orderedTasks = [];
                        savedOrder.forEach(orderItem => {
                            if (taskMap.has(orderItem.id)) {
                                orderedTasks.push(taskMap.get(orderItem.id));
                                taskMap.delete(orderItem.id);
                            }
                        });
                        taskMap.forEach(task => orderedTasks.push(task));
                    }
                    
                    // Render tasks
                    tasksList.innerHTML = orderedTasks.map(task => {
                        const config = this.getTaskConfig(task.id);
                        const isSelected = config.selected;
                        const sessions = config.sessions || 1;
                        const completedSessions = config.completedSessions || 0;
                        
                        return `
                            <div class="task-item ${isSelected ? 'selected' : ''}" data-task-id="${task.id}">
                                <div class="task-content">
                                    <div class="task-title">${task.content}</div>
                                    ${task.source === 'todoist' ? '<div class="task-project">Todoist</div>' : ''}
                                </div>
                                <div class="task-actions">
                                    <div class="task-sessions">
                                        <span class="sessions-text">${completedSessions}/${sessions}</span>
                                    </div>
                                    <button class="task-toggle-btn ${isSelected ? 'active' : ''}" data-task-id="${task.id}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M9 12l2 2 4-4"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Re-setup event listeners for the new tasks
                    this.setupTaskItemListeners(tasksList);
                }
            }
        }
    }

    setupTaskItemListeners(container) {
        // Setup toggle buttons
        const toggleBtns = container.querySelectorAll('.task-toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.taskId;
                const taskItem = btn.closest('.task-item');
                const config = this.getTaskConfig(taskId);
                
                // Toggle selection
                const newSelected = !config.selected;
                this.setTaskConfig(taskId, { ...config, selected: newSelected });
                
                // Update UI
                taskItem.classList.toggle('selected', newSelected);
                btn.classList.toggle('active', newSelected);
                
                // Update task button state and header
                this.updateTaskButtonState();
                this.updateCurrentTaskFromQueue();
                this.updateSessionInfo();
            });
        });
    }

    // Task configuration management
    getTaskConfig(taskId) {
        const configs = JSON.parse(localStorage.getItem('taskConfigs') || '{}');
        return configs[taskId] || { sessions: 1, selected: false };
    }

    setTaskConfig(taskId, config) {
        const configs = JSON.parse(localStorage.getItem('taskConfigs') || '{}');
        configs[taskId] = { ...configs[taskId], ...config };
        localStorage.setItem('taskConfigs', JSON.stringify(configs));
    }

    incrementTaskCompletedSessions(taskId) {
        const config = this.getTaskConfig(taskId);
        const currentCompleted = config.completedSessions || 0;
        const newCompleted = currentCompleted + 1;
        
        // Don't exceed the total sessions planned
        const totalSessions = config.sessions || 1;
        const finalCompleted = Math.min(newCompleted, totalSessions);
        
        this.setTaskConfig(taskId, { 
            ...config, 
            completedSessions: finalCompleted 
        });
    }

    setupTaskEventListeners(modal) {
        // Task checkbox click listeners - manual completion toggle
        const taskCheckboxes = modal.querySelectorAll('.task-checkbox input[type="checkbox"]');
        taskCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const taskId = checkbox.id.replace('task-', '');
                const isChecked = checkbox.checked;
                
                // Update task completion status
                this.toggleTaskCompletion(taskId, isChecked);
                
                // Update visual state
                this.updateTaskCompletionVisual(modal, taskId, isChecked);
                
                // Update window title immediately
                this.updateDisplay();

                // If we're on To-do and the task just got completed, remove it immediately
                // If we're on Done and the task was unchecked, remove it immediately
                const activeTab = modal.querySelector('.task-tab.active');
                const currentTab = activeTab ? activeTab.dataset.tab : 'todo';
                const taskItem = modal.querySelector(`[data-task-id="${taskId}"]`);
                if (taskItem) {
                    const shouldRemoveFromCurrentView = (currentTab === 'todo' && isChecked) || (currentTab === 'done' && !isChecked);
                    if (shouldRemoveFromCurrentView) {
                        try { taskItem.remove(); } catch (_) {}
                    }
                }

                // Ensure counts/empty state reflect the change
                this.rerenderTaskList();
            });
        });

        // Task menu (3 dots) click listeners - use bottom form in edit mode
        const taskMenus = modal.querySelectorAll('.task-menu');
        taskMenus.forEach(menu => {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = menu.dataset.taskId;
                const addTaskForm = modal.querySelector('#addTaskForm');
                const addTaskBtn = modal.querySelector('#showAddTaskForm');
                if (!addTaskForm || !addTaskBtn) return;
                
                // Enter edit mode, prefill fields
                const task = this.getLocalTasks().find(t => t.id === taskId);
                if (!task) {
                    // Only local tasks can be edited inline
                    return;
                }
                const config = this.getTaskConfig(taskId);
                this.editingTaskId = taskId;
                addTaskForm.style.display = 'block';
                addTaskBtn.disabled = true;
                // Hide list and add-section while editing
                const listEl = modal.querySelector('#todoistTasksList');
                const addSection = modal.querySelector('.add-task-section');
                if (listEl) listEl.style.display = 'none';
                if (addSection) addSection.style.display = 'none';
                const taskInput = addTaskForm.querySelector('#taskDescription');
                const pomodorosInput = addTaskForm.querySelector('#pomodorosCount');
                const deleteBtn = addTaskForm.querySelector('#deleteTask');
                if (taskInput) taskInput.value = task ? (task.content || '') : '';
                if (pomodorosInput) pomodorosInput.value = String(config.sessions || 1);
                if (deleteBtn) deleteBtn.style.display = '';
                if (taskInput) taskInput.focus();
                
                // Scroll form into view
                try { addTaskForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) {}
            });
        });
    }

    updateTaskSelectionVisual(modal, taskId, selected) {
        const taskItem = modal.querySelector(`[data-task-id="${taskId}"]`);
        if (taskItem) {
            if (selected) {
                taskItem.classList.add('selected');
            } else {
                taskItem.classList.remove('selected');
            }
        }
    }

    toggleTaskCompletion(taskId, isCompleted) {
        // Get all tasks to determine the source
        const allTasks = this.getAllTasks();
        const task = allTasks.find(t => t.id === taskId);
        
        if (task) {
            if (task.source === 'local') {
                // Update local task completion status
                const localTasks = this.getLocalTasks();
                const taskIndex = localTasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    localTasks[taskIndex].completed = isCompleted;
                    this.setLocalTasks(localTasks);
                }
            } else if (task.source === 'todoist') {
                // For Todoist tasks imported to local storage, update them there
                const localTasks = this.getLocalTasks();
                const taskIndex = localTasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    localTasks[taskIndex].completed = isCompleted;
                    this.setLocalTasks(localTasks);
                }
                
                // Also track completion state for live Todoist tasks
                this.updateTodoistTaskCompletionState(taskId, isCompleted);
                
                // If completing, also call the API
                if (isCompleted) {
                    this.completeTodoistTaskInTodoist(taskId);
                }
            } else if (task.source === 'notion') {
                // For Notion tasks, update in local tasks
                const localTasks = this.getLocalTasks();
                const taskIndex = localTasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    localTasks[taskIndex].completed = isCompleted;
                    this.setLocalTasks(localTasks);
                }
                
                // Update task in Notion
                this.completeNotionTask(task, isCompleted);
            }
        }
        
        // Update task config to reflect completion
        const taskConfig = this.getTaskConfig(taskId);
        if (isCompleted) {
            // Mark as completed by setting completed sessions to total sessions
            this.setTaskConfig(taskId, { 
                ...taskConfig, 
                completedSessions: taskConfig.sessions || 1 
            });
        } else {
            // Reset completion by setting completed sessions to 0
            this.setTaskConfig(taskId, { 
                ...taskConfig, 
                completedSessions: 0 
            });
        }
        
        // Update the main timer banner
        this.updateCurrentTaskBanner();
        this.rebuildTaskQueue();
        this.updateCurrentTaskFromQueue();
        this.updateDisplay();
        
        // Re-render tasks to move between tabs
        this.rerenderTaskList();
    }

    updateTaskCompletionVisual(modal, taskId, isCompleted) {
        const taskItem = modal.querySelector(`[data-task-id="${taskId}"]`);
        if (taskItem) {
            if (isCompleted) {
                taskItem.classList.add('completed');
            } else {
                taskItem.classList.remove('completed');
            }
        }
    }

    rerenderTaskList() {
        // Update the task sidebar panel if it's open
        const taskSidePanel = document.getElementById('taskSidePanel');
        if (taskSidePanel && taskSidePanel.classList.contains('open')) {
            this.refreshTaskModalIfOpen();
        }
        
        // Find the tasks modal and re-render the task list
        // The modal uses the class 'focus-stats-overlay'/'focus-stats-modal' for the tasks UI
        const modal = document.querySelector('.focus-stats-modal');
        if (modal) {
            const listEl = modal.querySelector('#todoistTasksList');
            if (listEl) {
                // Get current tab
                const activeTab = modal.querySelector('.task-tab.active');
                const currentTab = activeTab ? activeTab.dataset.tab : 'todo';
                
                // Re-render tasks with current tab filter
                this.renderTasksInModal(modal, currentTab);
            }
        }
    }

    renderTasksInModal(modal, currentTab) {
        const listEl = modal.querySelector('#todoistTasksList');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        const allTasks = this.getAllTasks();
        
        // Filter tasks based on current tab
        let filteredTasks = allTasks;
        if (currentTab === 'todo') {
            filteredTasks = allTasks.filter(task => !task.completed);
        } else if (currentTab === 'done') {
            filteredTasks = allTasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            // Show appropriate message based on current tab
            if (currentTab === 'done') {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                            </svg>
                        </div>
                        <div class="empty-text">No completed tasks yet</div>
                        <div class="empty-subtext">Complete some tasks to see them here</div>
                    </div>
                `;
            } else {
                // For todo tab, show empty list without message
                listEl.innerHTML = '';
            }
            return;
        }
        
        // Apply saved task order
        const savedOrder = this.getTaskOrder();
        let orderedTasks = filteredTasks;
        
        if (savedOrder.length > 0) {
            orderedTasks = filteredTasks.sort((a, b) => {
                const aIndex = savedOrder.indexOf(a.id);
                const bIndex = savedOrder.indexOf(b.id);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
        }
        
        orderedTasks.forEach((task, index) => {
            const item = document.createElement('div');
            item.className = 'task-item';
            item.draggable = true;
            item.dataset.taskId = task.id;
            item.dataset.index = index;
            
            const taskConfig = this.getTaskConfig(task.id);
            const completedSessions = taskConfig.completedSessions || 0;
            const totalSessions = taskConfig.sessions || 1;
            const isCompleted = task.completed || (completedSessions >= totalSessions);
            
            const itemContent = `
                <div class="task-checkbox">
                    <input type="checkbox" id="task-${task.id}" ${isCompleted ? 'checked' : ''}>
                    <label for="task-${task.id}"></label>
                </div>
                <div class="task-content">
                    <div class="task-title">
                        ${task.content || '(untitled)'}
                    </div>
                </div>
                <div class="task-progress">
                    <span class="progress-text">${completedSessions}/${totalSessions}</span>
                </div>
                <div class="task-menu" data-task-id="${task.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="19" cy="12" r="1"/>
                        <circle cx="5" cy="12" r="1"/>
                    </svg>
                </div>
            `;
            
            item.innerHTML = itemContent;
            
            // Set initial selected state
            if (taskConfig.selected) {
                item.classList.add('selected');
            }
            
            // Add completed class if task is completed
            if (isCompleted) {
                item.classList.add('completed');
            }
            
            listEl.appendChild(item);
        });
        
        // Re-setup event listeners for the new elements
        this.setupTaskEventListeners(modal);
    }
    showEditTaskInline(taskId, modal) {
        const task = this.getLocalTasks().find(t => t.id === taskId);
        if (!task) return;

        const taskItem = modal.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskItem) return;

        const taskConfig = this.getTaskConfig(taskId);
        const currentSessions = taskConfig.sessions || 1;

        // Replace task item with the same form component as Add Task
        taskItem.innerHTML = `
            <div class="add-task-form">
                <div class="form-group">
                    <label>What are you working on?</label>
                    <input type="text" id="editTaskDescription" value="${task.content}" maxlength="100">
                </div>
                <div class="form-group">
                    <label>Sessions</label>
                    <div class="pomodoros-control">
                        <button class="pomodoros-btn" id="editDecreasePomodoros">-</button>
                        <input type="number" id="editPomodorosCount" value="${currentSessions}" min="1" max="10">
                        <button class="pomodoros-btn" id="editIncreasePomodoros">+</button>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" id="cancelEditTask">Cancel</button>
                    <button class="btn-primary" id="saveEditTask">Save</button>
                </div>
            </div>
        `;

        // Setup form controls
        const taskInput = taskItem.querySelector('#editTaskDescription');
        const pomodorosInput = taskItem.querySelector('#editPomodorosCount');
        const decreaseBtn = taskItem.querySelector('#editDecreasePomodoros');
        const increaseBtn = taskItem.querySelector('#editIncreasePomodoros');
        const saveBtn = taskItem.querySelector('#saveEditTask');
        const cancelBtn = taskItem.querySelector('#cancelEditTask');

        // Pomodoros controls
        if (decreaseBtn && pomodorosInput) {
            decreaseBtn.addEventListener('click', () => {
                const current = parseInt(pomodorosInput.value);
                if (current > 1) {
                    pomodorosInput.value = current - 1;
                }
            });
        }

        if (increaseBtn && pomodorosInput) {
            increaseBtn.addEventListener('click', () => {
                const current = parseInt(pomodorosInput.value);
                if (current < 10) {
                    pomodorosInput.value = current + 1;
                }
            });
        }

        // Cancel button - restore original task item
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // Deselect the task when canceling edit
                this.setTaskConfig(taskId, { ...taskConfig, selected: false });
                this.updateCurrentTaskBanner();
                this.rebuildTaskQueue();
                
                // Re-render the task list to restore original items
                const renderTasks = () => {
                    const listEl = modal.querySelector('#todoistTasksList');
                    if (!listEl) return;
                    
                    listEl.innerHTML = '';
                    const allTasks = this.getAllTasks();
                    
                    if (allTasks.length === 0) {
                        const addTaskForm = modal.querySelector('#addTaskForm');
                        const addTaskBtn = modal.querySelector('#showAddTaskForm');
                        if (addTaskForm) addTaskForm.style.display = 'block';
                        if (addTaskBtn) {
                            addTaskBtn.style.display = 'none';
                            addTaskBtn.disabled = true;
                        }
                        return;
                    }
                    
                    allTasks.forEach((task, index) => {
                        const item = document.createElement('div');
                        item.className = 'task-item';
                        item.draggable = true;
                        item.dataset.taskId = task.id;
                        item.dataset.index = index;
                        
                        const taskConfig = this.getTaskConfig(task.id);
                        const completedSessions = taskConfig.completedSessions || 0;
                        const totalSessions = taskConfig.sessions || 1;
                        const isCompleted = task.completed || (completedSessions >= totalSessions);
                        
                        const itemContent = `
                            <div class="task-checkbox">
                                <input type="checkbox" id="task-${task.id}" ${isCompleted ? 'checked' : ''} disabled>
                                <label for="task-${task.id}"></label>
                            </div>
                            <div class="task-content">
                                <div class="task-title">
                                    ${task.content || '(untitled)'}
                                </div>
                            </div>
                            <div class="task-progress">
                                <span class="progress-text">${completedSessions}/${totalSessions}</span>
                            </div>
                            <div class="task-menu" data-task-id="${task.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="19" cy="12" r="1"/>
                                    <circle cx="5" cy="12" r="1"/>
                                </svg>
                            </div>
                        `;
                        
                        item.innerHTML = itemContent;
                        
                        if (taskConfig.selected) {
                            item.classList.add('selected');
                        }
                        
                        listEl.appendChild(item);
                    });
                    
                    this.setupTaskEventListeners(modal);
                };
                
                renderTasks();
            });
        }

        // Save button
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const description = taskInput ? taskInput.value.trim() : '';
                const pomodoros = pomodorosInput ? parseInt(pomodorosInput.value) : 1;
                
                if (description) {
                    // Update task content
                    const tasks = this.getLocalTasks();
                    const taskIndex = tasks.findIndex(t => t.id === taskId);
                    if (taskIndex !== -1) {
                        tasks[taskIndex].content = description;
                        this.setLocalTasks(tasks);
                    }
                    
                    // Update task config
                    this.setTaskConfig(taskId, { sessions: pomodoros });
                    
                    // Re-render the task list
                    const renderTasks = () => {
                        const listEl = modal.querySelector('#todoistTasksList');
                        if (!listEl) return;
                        
                        listEl.innerHTML = '';
                        const allTasks = this.getAllTasks();
                        
                        if (allTasks.length === 0) {
                            const addTaskForm = modal.querySelector('#addTaskForm');
                            const addTaskBtn = modal.querySelector('#showAddTaskForm');
                            if (addTaskForm) addTaskForm.style.display = 'block';
                            if (addTaskBtn) {
                                addTaskBtn.style.display = 'none';
                                addTaskBtn.disabled = true;
                            }
                            return;
                        }
                        
                        allTasks.forEach((task, index) => {
                            const item = document.createElement('div');
                            item.className = 'task-item';
                            item.draggable = true;
                            item.dataset.taskId = task.id;
                            item.dataset.index = index;
                            
                            const taskConfig = this.getTaskConfig(task.id);
                            const completedSessions = taskConfig.completedSessions || 0;
                            const totalSessions = taskConfig.sessions || 1;
                            const isCompleted = task.completed || (completedSessions >= totalSessions);
                            
                            const itemContent = `
                                <div class="task-checkbox">
                                    <input type="checkbox" id="task-${task.id}" ${isCompleted ? 'checked' : ''} disabled>
                                    <label for="task-${task.id}"></label>
                                </div>
                                <div class="task-content">
                                    <div class="task-title">
                                        ${task.content || '(untitled)'}
                                    </div>
                                </div>
                                <div class="task-progress">
                                    <span class="progress-text">${completedSessions}/${totalSessions}</span>
                                </div>
                                <div class="task-menu" data-task-id="${task.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="1"/>
                                        <circle cx="19" cy="12" r="1"/>
                                        <circle cx="5" cy="12" r="1"/>
                                    </svg>
                                </div>
                            `;
                            
                            item.innerHTML = itemContent;
                            
                            if (taskConfig.selected) {
                                item.classList.add('selected');
                            }
                            
                            listEl.appendChild(item);
                        });
                        
                        this.setupTaskEventListeners(modal);
                    };
                    
                    renderTasks();
                    // Update header to reflect changes immediately
                    this.updateCurrentTaskFromQueue();
                    this.updateSessionInfo();
                }
            });
        }

        // Enter key to save
        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && saveBtn) {
                    saveBtn.click();
                }
            });
        }

        // Focus on the input field
        if (taskInput) {
            taskInput.focus();
        }

        // Auto-select the task being edited
        this.setTaskConfig(taskId, { ...taskConfig, selected: true });
        this.updateCurrentTaskBanner();
        this.rebuildTaskQueue();
    }


    calculateFinishTime(totalMinutes) {
        if (totalMinutes === 0) return '--:--';
        
        const now = new Date();
        const finishTime = new Date(now.getTime() + totalMinutes * 60000);
        return finishTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    // Show selected tasks in the main timer interface
    updateCurrentTaskBanner() {
        const selectedTasks = this.getSelectedTasks();
        const taskBanner = document.getElementById('currentTaskBanner');
        
        console.log('🔄 updateCurrentTaskBanner called', { 
            selectedTasksCount: selectedTasks.length, 
            bannerExists: !!taskBanner,
            selectedTasks: selectedTasks.map(t => ({ id: t.id, content: t.content, selected: this.getTaskConfig(t.id).selected }))
        });
        
        if (!taskBanner) {
            // Create task banner if it doesn't exist
            console.log('🔄 Creating task banner...');
            this.createTaskBanner();
            return;
        }

        if (selectedTasks.length === 0) {
            console.log('🔄 No selected tasks, hiding banner');
            taskBanner.style.display = 'none';
            return;
        }

        // Show current task and progress (use currentTaskIndex across queue)
        let currentTask;
        if (Array.isArray(this.taskQueue) && this.taskQueue.length > 0 && this.currentTaskIndex < this.taskQueue.length) {
            currentTask = this.taskQueue[this.currentTaskIndex];
        } else {
            currentTask = selectedTasks[0];
        }
        
        console.log('🔄 Showing task in banner', { currentTask: currentTask?.content });
        
        const taskInfo = document.getElementById('currentTaskInfo');
        const taskProgress = document.getElementById('taskProgress');
        
        if (taskInfo) {
            taskInfo.innerHTML = `
                <div class="current-task-title">${currentTask.content}</div>
                <div class="current-task-progress">Task 1 of ${selectedTasks.length}</div>
            `;
        }
        
        if (taskProgress) {
            taskProgress.innerHTML = `
                <div class="task-sessions-info">
                    <span>${currentTask.sessions} session${currentTask.sessions > 1 ? 's' : ''}</span>
                </div>
            `;
        }

        taskBanner.style.display = 'block';
        console.log('🔄 Banner should now be visible');
        
        // Update task button state
        this.updateTaskButtonState();
    }

    updateTaskButtonState() {
        const taskButton = document.getElementById('taskToggleBtn');
        if (!taskButton) return;

        const selectedTasks = this.getSelectedTasks();
        
        if (selectedTasks.length > 0) {
            // Has active tasks - make button blue
            taskButton.classList.add('active');
        } else {
            // No active tasks - make button white
            taskButton.classList.remove('active');
        }
    }

    createTaskBanner() {
        // Create task banner element
        const taskBanner = document.createElement('div');
        taskBanner.id = 'currentTaskBanner';
        taskBanner.className = 'current-task-banner';
        taskBanner.style.display = 'none';
        
        taskBanner.innerHTML = `
            <div class="current-task-content">
                <div class="current-task-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                    </svg>
                </div>
                <div class="current-task-details">
                    <div id="currentTaskInfo">
                        <div class="current-task-title">No task selected</div>
                        <div class="current-task-progress">Select a task to focus on</div>
                    </div>
                    <div id="taskProgress">
                        <div class="task-sessions-info">0 sessions</div>
                    </div>
                </div>
                <button class="change-task-btn" id="changeTaskBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M3 12h18"/>
                        <path d="M3 18h18"/>
                    </svg>
                </button>
            </div>
        `;

        // Insert after the timer content
        const timerContent = document.querySelector('.timer-content');
        if (timerContent) {
            timerContent.parentNode.insertBefore(taskBanner, timerContent.nextSibling);
        }

        // Add event listener for change task button
        const changeTaskBtn = document.getElementById('changeTaskBtn');
        if (changeTaskBtn) {
            changeTaskBtn.addEventListener('click', () => {
                this.showTaskListModal();
            });
        }
    }

    getSelectedTasks() {
        const allTasks = this.getAllTasks();
        
        console.log('🔍 getSelectedTasks - allTasks:', allTasks.map(t => ({ id: t.id, content: t.content, completed: t.completed })));
        
        // Get selected tasks
        const selectedTasks = allTasks.filter(task => {
            const config = this.getTaskConfig(task.id);
            const isSelected = config.selected && !task.completed;
            console.log('🔍 Task filter:', { 
                id: task.id, 
                content: task.content, 
                selected: config.selected, 
                completed: task.completed, 
                isSelected 
            });
            return isSelected;
        }).map(task => {
            const config = this.getTaskConfig(task.id);
            return {
                ...task,
                sessions: config.sessions || 1
            };
        });
        
        console.log('🔍 getSelectedTasks - selectedTasks COUNT:', selectedTasks.length);
        console.log('🔍 getSelectedTasks - selectedTasks:', selectedTasks.map(t => ({ id: t.id, content: t.content })));
        console.log('🔍 getSelectedTasks - selectedTasks FULL:', selectedTasks);
        
        // Apply saved task order
        const savedOrder = this.getTaskOrder();
        console.log('🔍 savedOrder:', savedOrder);
        console.log('🔍 savedOrder.length:', savedOrder.length);
        
        if (savedOrder.length > 0) {
            // Create a map for quick lookup
            const taskMap = new Map(selectedTasks.map(task => [task.id, task]));
            console.log('🔍 taskMap has', taskMap.size, 'tasks');
            
            // Sort by saved order
            const orderedTasks = [];
            savedOrder.forEach(orderItem => {
                console.log('🔍 Checking orderItem:', orderItem.id, 'has?', taskMap.has(orderItem.id));
                if (taskMap.has(orderItem.id)) {
                    orderedTasks.push(taskMap.get(orderItem.id));
                    taskMap.delete(orderItem.id);
                }
            });
            
            // Add any remaining tasks that weren't in the saved order
            console.log('🔍 Remaining tasks in map:', taskMap.size);
            taskMap.forEach(task => {
                console.log('🔍 Adding remaining task:', task.content);
                orderedTasks.push(task);
            });
            
            console.log('🔍 orderedTasks final:', orderedTasks.map(t => ({ id: t.id, content: t.content })));
            return orderedTasks;
        }
        
        console.log('🔍 Returning selectedTasks as-is (no savedOrder)');
        return selectedTasks;
    }

    // Local task management
    getLocalTasks() {
        return JSON.parse(localStorage.getItem('localTasks') || '[]');
    }

    setLocalTasks(tasks) {
        localStorage.setItem('localTasks', JSON.stringify(tasks));
    }

    // Todoist task completion state management
    getTodoistTaskCompletionState() {
        return JSON.parse(localStorage.getItem('todoistTaskCompletionState') || '{}');
    }

    setTodoistTaskCompletionState(state) {
        localStorage.setItem('todoistTaskCompletionState', JSON.stringify(state));
    }

    updateTodoistTaskCompletionState(taskId, isCompleted) {
        const currentState = this.getTodoistTaskCompletionState();
        currentState[taskId] = isCompleted;
        this.setTodoistTaskCompletionState(currentState);
    }

    getAllTasks() {
        const localTasks = this.getLocalTasks();
        const todoistTasks = this.isAuthenticated && this.user && this.isPro ? (this.todoistTasks || []) : [];
        
        // Get local completion state for Todoist tasks
        const todoistCompletionState = this.getTodoistTaskCompletionState();
        
        // Combine and mark source (preserve existing source if present)
        const allTasks = [
            ...localTasks.map(task => ({ ...task, source: task.source || 'local' })),
            ...todoistTasks.map(task => ({ 
                ...task, 
                source: 'todoist',
                completed: todoistCompletionState[task.id] || false
            }))
        ];
        
        return allTasks;
    }

    loadAllTasks() {
        // Load local tasks
        this.localTasks = this.getLocalTasks();
        
        // Load Todoist tasks if authenticated
        if (this.isAuthenticated && this.user) {
            this.fetchTodoistData().catch(() => {
                this.todoistTasks = [];
                this.todoistProjectsById = {};
            });
        } else {
            this.todoistTasks = [];
            this.todoistProjectsById = {};
        }
    }

    showTaskMenu(modal) {
        const menu = document.createElement('div');
        menu.className = 'task-menu-dropdown';
        menu.style.cssText = `
            position: absolute;
            top: 40px;
            right: 20px;
            background: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px 0;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000;
        `;

        const menuItems = [
            { text: 'Clear finished tasks', icon: 'trash', action: () => this.clearFinishedTasks() },
            { text: 'Use Template', icon: 'template', action: () => this.showTemplatesModal() },
            { text: 'Import from Todoist', icon: 'download', action: () => this.showImportModal(), locked: !this.isAuthenticated },
            { text: 'Clear act pomodoros', icon: 'check', action: () => this.clearActPomodoros() },
            { text: 'Hide tasks', icon: 'eye', action: () => this.hideTasks(), locked: !this.isAuthenticated },
            { text: 'Clear all tasks', icon: 'trash', action: () => this.clearAllTasks() }
        ];

        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'task-menu-item';
            menuItem.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                color: ${item.locked ? 'rgba(255, 255, 255, 0.5)' : '#ffffff'};
                transition: background-color 0.2s;
            `;
            
            if (!item.locked) {
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                });
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.backgroundColor = 'transparent';
                });
            }

            const getIconSVG = (iconName) => {
                const icons = {
                    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg>`,
                    template: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`,
                    download: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
                    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>`,
                    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
                };
                return icons[iconName] || '';
            };

            menuItem.innerHTML = `
                <span>${getIconSVG(item.icon)}</span>
                <span>${item.text}</span>
                ${item.locked ? '<span style="margin-left: auto; color: rgba(255, 255, 255, 0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M7 11V7a5 5 0 0 1 10 0v0"></path></svg></span>' : ''}
            `;

            if (!item.locked) {
                menuItem.addEventListener('click', () => {
                    item.action();
                    document.body.removeChild(menu);
                });
            }

            menu.appendChild(menuItem);
        });

        // Position menu
        const rect = modal.getBoundingClientRect();
        menu.style.top = '40px';
        menu.style.right = '20px';

        modal.style.position = 'relative';
        modal.appendChild(menu);

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    setupDragAndDrop(modal) {
        const listEl = modal.querySelector('#todoistTasksList');
        let draggedElement = null;

        // Drag start
        listEl.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.5';
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        // Drag end
        listEl.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.style.opacity = '';
                e.target.classList.remove('dragging');
                draggedElement = null;
            }
        });

        // Drag over
        listEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(listEl, e.clientY);
            
            if (afterElement == null) {
                listEl.appendChild(draggedElement);
            } else {
                listEl.insertBefore(draggedElement, afterElement);
            }
        });

        // Drop
        listEl.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement) {
                this.updateTaskOrder(listEl);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateTaskOrder(listEl) {
        const taskItems = listEl.querySelectorAll('.task-item');
        const newOrder = [];
        
        taskItems.forEach((item, index) => {
            const taskId = item.dataset.taskId;
            newOrder.push({ id: taskId, order: index });
        });
        
        // Update local storage with new order
        this.saveTaskOrder(newOrder);
    }

    saveTaskOrder(newOrder) {
        localStorage.setItem('taskOrder', JSON.stringify(newOrder));
    }

    getTaskOrder() {
        return JSON.parse(localStorage.getItem('taskOrder') || '[]');
    }

    showAddTaskModal() {
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';

        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.innerHTML = `
            <button class="close-focus-stats-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="add-task-modal-content">
                <h3>Add Task</h3>
                <div class="task-form">
                    <div class="form-group">
                        <label>What are you working on?</label>
                        <input type="text" id="taskDescription" placeholder="Enter task description" maxlength="100">
                    </div>
                    <div class="form-group">
                        <label>Est Pomodoros</label>
                        <div class="pomodoros-control">
                            <button class="pomodoros-btn" id="decreasePomodoros">-</button>
                            <input type="number" id="pomodorosCount" value="1" min="1" max="10">
                            <button class="pomodoros-btn" id="increasePomodoros">+</button>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" id="cancelAddTask">Cancel</button>
                    <button class="btn-primary" id="saveTask">Save</button>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
        };

        modal.querySelector('.close-focus-stats-x').addEventListener('click', close);
        modal.querySelector('#cancelAddTask').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Pomodoros controls
        const decreaseBtn = modal.querySelector('#decreasePomodoros');
        const increaseBtn = modal.querySelector('#increasePomodoros');
        const countInput = modal.querySelector('#pomodorosCount');

        decreaseBtn.addEventListener('click', () => {
            const current = parseInt(countInput.value);
            if (current > 1) countInput.value = current - 1;
        });

        increaseBtn.addEventListener('click', () => {
            const current = parseInt(countInput.value);
            if (current < 10) countInput.value = current + 1;
        });

        // Save task
        modal.querySelector('#saveTask').addEventListener('click', () => {
            const description = modal.querySelector('#taskDescription').value.trim();
            const pomodoros = parseInt(countInput.value);
            
            if (description) {
                this.addLocalTask(description, pomodoros);
                close();
                // Refresh the task list
                this.showTaskListModal();
            }
        });
    }

    addLocalTask(description, pomodoros = 1) {
        const tasks = this.getLocalTasks();
        const newTask = {
            id: 'local_' + Date.now(),
            content: description,
            pomodoros: pomodoros,
            created: new Date().toISOString(),
            completed: false,
            source: 'local'
        };
        
        tasks.push(newTask);
        this.setLocalTasks(tasks);
        // Persist planned sessions so the card progress matches the chosen value
        this.setTaskConfig(newTask.id, { sessions: pomodoros, selected: true, completedSessions: 0 });
        
        console.log('🔄 Task created, updating banner...', { taskId: newTask.id, description });
        
        // Update the main task banner immediately
        this.updateCurrentTaskBanner();
        this.rebuildTaskQueue();
        this.updateCurrentTaskFromQueue();
        this.updateDisplay(); // Update window title immediately
        
        // Force a small delay to ensure DOM updates
        setTimeout(() => {
            console.log('🔄 Delayed banner update...');
            this.updateCurrentTaskBanner();
            this.updateCurrentTaskFromQueue();
            this.updateDisplay(); // Update window title again
        }, 100);
        
        // 🎯 Track Task Created event to Mixpanel
        if (window.mixpanelTracker) {
            window.mixpanelTracker.trackTaskCreated(description, pomodoros);
            console.log('📊 Task created event tracked to Mixpanel');
        }
    }

    showImportModal() {
        if (!this.isAuthenticated || !this.user) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';

        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal import-modal';
        modal.innerHTML = `
            <button class="close-focus-stats-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="import-modal-content">
                <h3>Import Tasks</h3>
                <div class="search-section">
                    <div class="search-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input type="text" id="searchTasks" placeholder="Search Tasks">
                    </div>
                </div>
                <div class="projects-section">
                    <div class="projects-list" id="projectsList">
                        <div class="loading">Loading projects...</div>
                    </div>
                </div>
                <div class="import-actions">
                    <button class="btn-secondary" id="clearSelection">Clear Selection</button>
                    <button class="btn-primary" id="importTasks" disabled>Import</button>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
        };

        modal.querySelector('.close-focus-stats-x').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Load projects and tasks
        this.loadImportData(modal);
    }
    async loadImportData(modal) {
        const projectsList = modal.querySelector('#projectsList');
        
        try {
            // Build query params (Developer Mode + uid) just like other flows
            const viewMode = localStorage.getItem('viewMode');
            const userId = window.Clerk?.user?.id || '';
            const params = new URLSearchParams();
            if (viewMode === 'pro') {
                params.append('devMode', 'pro');
                params.append('bypass', 'true');
            }
            if (userId) params.append('uid', userId);
            const qs = params.toString() ? `?${params.toString()}` : '';

            // Load projects
            const projectsRes = await fetch(`/api/todoist-projects${qs}`);
            const projects = projectsRes.ok ? await projectsRes.json() : [];
            
            // Load tasks
            const tasksRes = await fetch(`/api/todoist-tasks${qs}`);
            const tasks = tasksRes.ok ? await tasksRes.json() : [];
            
            // Group tasks by project
            const tasksByProject = {};
            tasks.forEach(task => {
                const projectId = task.project_id;
                if (!tasksByProject[projectId]) {
                    tasksByProject[projectId] = [];
                }
                tasksByProject[projectId].push(task);
            });
            
            // Render projects
            projectsList.innerHTML = '';
            projects.forEach(project => {
                const projectTasks = tasksByProject[project.id] || [];
                if (projectTasks.length === 0) return;
                
                const projectDiv = document.createElement('div');
                projectDiv.className = 'project-group';
                projectDiv.innerHTML = `
                    <div class="project-header">
                        <h4>${project.name}</h4>
                        <span class="task-count">${projectTasks.length} tasks</span>
                    </div>
                    <div class="project-tasks">
                        ${projectTasks.map(task => `
                            <div class="import-task-item" data-task-id="${task.id}">
                                <input type="checkbox" class="task-checkbox">
                                <span class="task-content">${task.content}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                projectsList.appendChild(projectDiv);
            });
            
            // Setup selection handlers
            this.setupImportHandlers(modal);
            
        } catch (error) {
            projectsList.innerHTML = '<div class="error">Failed to load tasks</div>';
        }
    }

    setupImportHandlers(modal) {
        const checkboxes = modal.querySelectorAll('.import-task-item input[type="checkbox"]');
        const importBtn = modal.querySelector('#importTasks');
        const clearBtn = modal.querySelector('#clearSelection');
        
        const updateImportButton = () => {
            const selected = modal.querySelectorAll('.import-task-item input[type="checkbox"]:checked');
            importBtn.disabled = selected.length === 0;
            importBtn.textContent = `Import (${selected.length})`;
        };
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateImportButton);
        });
        
        clearBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = false);
            updateImportButton();
        });
        
        importBtn.addEventListener('click', () => {
            const selected = modal.querySelectorAll('.import-task-item input[type="checkbox"]:checked');
            selected.forEach(checkbox => {
                const taskId = checkbox.closest('.import-task-item').dataset.taskId;
                // Add to local tasks
                const task = this.todoistTasks.find(t => t.id === taskId);
                if (task) {
                    this.addLocalTask(task.content, 1);
                }
            });
            
            // Close modal and refresh
            modal.closest('.focus-stats-overlay').querySelector('.close-focus-stats-x').click();
            this.showTaskListModal();
        });
    }

    // Menu action functions
    clearFinishedTasks() {
        const tasks = this.getLocalTasks();
        const activeTasks = tasks.filter(task => !task.completed);
        this.setLocalTasks(activeTasks);
        
        // Update UI immediately
        this.updateCurrentTaskBanner();
        this.rebuildTaskQueue();
        this.updateCurrentTaskFromQueue();
        
        this.showTaskListModal();
    }

    clearCompletedTasks() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'logout-modal';
        modal.style.cssText = 'max-width: 440px; padding: 32px; position: relative;';
        modal.innerHTML = `
            <button class="close-modal-x" id="closeClearDoneModal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            
            <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: white; line-height: 1.3; text-align: left;">
                Clear Done Tasks
            </h3>
            <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 32px; line-height: 1.5; text-align: left;">
                Are you sure you want to clear all completed tasks? This action cannot be undone.
            </p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="logout-modal-btn logout-modal-btn-secondary" id="cancelClearDone">Cancel</button>
                <button class="logout-modal-btn logout-modal-btn-primary" id="confirmClearDone">OK</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
        };
        
        // Close X button
        modal.querySelector('#closeClearDoneModal').addEventListener('click', close);
        
        // Cancel button
        modal.querySelector('#cancelClearDone').addEventListener('click', close);
        
        // Confirm button
        modal.querySelector('#confirmClearDone').addEventListener('click', () => {
            const tasks = this.getLocalTasks();
            const activeTasks = tasks.filter(task => !task.completed);
            this.setLocalTasks(activeTasks);
            
            // Update UI immediately
            this.updateCurrentTaskBanner();
            this.rebuildTaskQueue();
            this.updateCurrentTaskFromQueue();
            
            // Re-render Task Sidebar immediately
            this.renderTasksInSidePanel();
            
            close();
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    clearAllTasks() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'logout-modal';
        modal.style.cssText = 'max-width: 440px; padding: 32px; position: relative;';
        modal.innerHTML = `
            <button class="close-modal-x" id="closeClearAllModal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            
            <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: white; line-height: 1.3; text-align: left;">
                Clear All Tasks
            </h3>
            <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 32px; line-height: 1.5; text-align: left;">
                Are you sure you want to clear all tasks? This action cannot be undone.
            </p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="logout-modal-btn logout-modal-btn-secondary" id="cancelClearAll">Cancel</button>
                <button class="logout-modal-btn logout-modal-btn-primary" id="confirmClearAll">OK</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
        };
        
        // Close X button
        modal.querySelector('#closeClearAllModal').addEventListener('click', close);
        
        // Cancel button
        modal.querySelector('#cancelClearAll').addEventListener('click', close);
        
        // Confirm button
        modal.querySelector('#confirmClearAll').addEventListener('click', () => {
            this.setLocalTasks([]);
            // Explicit clear is OK here since the user is clearing everything
            localStorage.removeItem('taskConfigs');
            
            // Update UI immediately
            this.updateCurrentTaskBanner();
            this.rebuildTaskQueue();
            this.updateCurrentTaskFromQueue();
            
            // Re-render Task Sidebar immediately
            this.renderTasksInSidePanel();
            
            close();
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    clearActPomodoros() {
        // Clear current session data
        this.currentTask = null;
        this.updateCurrentTaskBanner();
    }

    showTemplatesModal() {
        // TODO: Implement templates
        alert('Templates feature coming soon!');
    }

    hideTasks() {
        // TODO: Implement task hiding
        alert('Hide tasks feature coming soon!');
    }


    async fetchTodoistData() {
        // Never fetch Todoist data when not authenticated
        if (!this.isAuthenticated || !this.user) {
            this.todoistTasks = [];
            this.todoistProjectsById = {};
            return;
        }
        try {
            // Check if Developer Mode is active
            const viewMode = localStorage.getItem('viewMode');
            const userId = window.Clerk?.user?.id || '';
            
            // Build query params
            const params = new URLSearchParams();
            if (viewMode === 'pro') {
                params.append('devMode', 'pro');
                params.append('bypass', 'true'); // Extra bypass flag for testing
            }
            if (userId) params.append('uid', userId);
            const queryString = params.toString() ? `?${params.toString()}` : '';
            
            console.log('🚀 Fetching Todoist data with params:', queryString);
            console.log('🚀 viewMode:', viewMode);
            console.log('🚀 userId:', userId);
            
            // Fetch projects via proxy
            const projRes = await fetch(`/api/todoist-projects${queryString}`);
            if (projRes.ok) {
                const projects = await projRes.json();
                this.todoistProjectsById = {};
                projects.forEach(p => { this.todoistProjectsById[p.id] = p; });
                console.log('Todoist projects loaded:', projects.length);
            } else {
                console.error('Failed to fetch projects:', projRes.status, await projRes.text());
                this.todoistProjectsById = {};
            }

            // Fetch tasks via proxy
            const tasksRes = await fetch(`/api/todoist-tasks${queryString}`);
            if (tasksRes.ok) {
                const tasks = await tasksRes.json();
                this.todoistTasks = tasks;
                console.log('Todoist tasks loaded:', tasks.length);
            } else {
                console.error('Failed to fetch tasks:', tasksRes.status, await tasksRes.text());
                this.todoistTasks = [];
            }
        } catch (e) {
            console.error('Error fetching Todoist data:', e);
            this.todoistTasks = [];
            this.todoistProjectsById = {};
        }
    }

    updateCurrentTaskBanner() {
        // Update session tasks from selected tasks
        this.updateSessionTasksFromSelected();
        
        // Update session info line to include current task if any
        // Reuse updateSessionInfo to centralize rendering
        this.updateSessionInfo();
    }

    updateCycleCounter() {
        // Only track stats for authenticated users
        if (!this.isAuthenticated) {
            return;
        }
        
        // Increment completed cycles counter without adding hours here
        // Focus time is already tracked in real-time during sessions
        const stats = this.getFocusStats();
        stats.completedCycles = (stats.completedCycles || 0) + 1;
        localStorage.setItem('focusStats', JSON.stringify(stats));

        // Update achievement counter display
        this.updateFocusHoursDisplay();
    }

    calculateFocusHoursInCycle() {
        // Calculate total focus time in the completed cycle
        let totalFocusSeconds = 0;
        this.cycleSections.forEach(section => {
            if (section.type === 'work') {
                totalFocusSeconds += section.duration;
            }
        });
        return totalFocusSeconds / 3600; // Convert to hours
    }

    addFocusTime(seconds) {
        // Only track stats for authenticated users
        if (!this.isAuthenticated) {
            return;
        }
        
        const hours = seconds / 3600; // Convert seconds to hours
        const now = new Date();
        const today = now.toDateString();
        const stats = this.getFocusStats();

        // Add to total focus time
        stats.totalHours = (stats.totalHours || 0) + hours;

        // Add to today's focus time
        if (!stats.daily) stats.daily = {};
        stats.daily[today] = (stats.daily[today] || 0) + hours;

        // Update consecutive days on first activity of the day
        if (stats.lastActiveDate !== today) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            if (stats.lastActiveDate === yesterdayStr) {
                stats.consecutiveDays = (stats.consecutiveDays || 0) + 1;
            } else {
                stats.consecutiveDays = 1;
            }
            stats.lastActiveDate = today;
        }

        // Save to localStorage
        localStorage.setItem('focusStats', JSON.stringify(stats));

        // Update display in real-time
        this.updateFocusHoursDisplay();
    }

    addTechniqueTime(seconds) {
        // Only track stats for authenticated users
        if (!this.isAuthenticated) {
            return;
        }
        
        // Track total technique time (focus + breaks) for Most Used Technique
        const hours = seconds / 3600;
        const stats = this.getFocusStats();
        const technique = this.getCurrentTechniqueName();

        if (!stats.techniqueTime) stats.techniqueTime = {};
        stats.techniqueTime[technique] = (stats.techniqueTime[technique] || 0) + hours;

        localStorage.setItem('focusStats', JSON.stringify(stats));
    }

    addFocusHours(hours) {
        // Only track stats for authenticated users
        if (!this.isAuthenticated) {
            return;
        }
        
        const today = new Date().toDateString();
        const stats = this.getFocusStats();
        
        // Add to total
        stats.totalHours = (stats.totalHours || 0) + hours;
        
        // Add to today
        if (!stats.daily) stats.daily = {};
        stats.daily[today] = (stats.daily[today] || 0) + hours;
        
        // Track technique usage
        const currentTechnique = this.getCurrentTechniqueName();
        if (!stats.techniqueUsage) stats.techniqueUsage = {};
        stats.techniqueUsage[currentTechnique] = (stats.techniqueUsage[currentTechnique] || 0) + 1;
        
        // Increment completed cycles (only when cycle is naturally completed)
        stats.completedCycles = (stats.completedCycles || 0) + 1;
        
        // Update consecutive days
        this.updateConsecutiveDays(stats);
        
        // Save back to localStorage
        localStorage.setItem('focusStats', JSON.stringify(stats));
    }

    getFocusStats() {
        try {
            return JSON.parse(localStorage.getItem('focusStats') || '{}');
        } catch {
            return {};
        }
    }

    // Day streak functions
    loadStreakData() {
        try {
            const data = JSON.parse(localStorage.getItem('streakData') || '{}');
            return {
                currentStreak: data.currentStreak || 0,
                lastActiveDate: data.lastActiveDate || null,
                ...data
            };
        } catch {
            return {
                currentStreak: 0,
                lastActiveDate: null
            };
        }
    }

    saveStreakData() {
        try {
            localStorage.setItem('streakData', JSON.stringify(this.streakData));
        } catch (error) {
            console.error('Error saving streak data:', error);
        }
    }

    updateStreak() {
        // Only track stats for authenticated users
        if (!this.isAuthenticated) {
            return;
        }
        
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        // Check if we already completed focus today
        if (this.hasCompletedFocusToday) {
            return; // Already counted today
        }

        // Mark that we completed focus today
        this.hasCompletedFocusToday = true;

        // If this is the first time today, update streak
        if (this.streakData.lastActiveDate !== today) {
            if (this.streakData.lastActiveDate === yesterdayStr) {
                // Consecutive day - increment streak
                this.streakData.currentStreak += 1;
            } else if (this.streakData.lastActiveDate === null) {
                // First time ever
                this.streakData.currentStreak = 1;
            } else {
                // Streak broken - reset to 1
                this.streakData.currentStreak = 1;
            }
            
            this.streakData.lastActiveDate = today;
            this.saveStreakData();
            this.updateStreakDisplay();
        }
    }

    updateStreakDisplay() {
        const streakDaysElement = document.getElementById('streakDays');
        if (streakDaysElement) {
            // In guest mode, always show 0. Only show real streak for authenticated users
            if (this.isAuthenticated) {
            streakDaysElement.textContent = this.streakData.currentStreak;
            } else {
                streakDaysElement.textContent = '0';
            }
        }
    }

    showStreakInfo() {
        // If user is not authenticated, show guest modal
        if (!this.isAuthenticated) {
            this.showGuestStreakModal();
            return;
        }
        
        // For authenticated users, show the full statistics modal
        this.showStatisticsModal();
    }

    showGuestStreakModal() {
        // Redirect to the full guest focus report teaser with 4 graphs
        this.showGuestFocusReportTeaser();
    }

    showGuestFocusReportTeaser() {
        // For guests, show 0 values since stats are not saved
        // Stats are only tracked for authenticated users
        const totalHours = 0;
        const completedCycles = 0;
        
        // Format hours
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);
        const timeString = `${hours}h ${minutes}m`;
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'upgrade-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        
        modal.innerHTML = `
            <button class="close-upgrade-x" id="closeGuestReportX">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="upgrade-content">
                <h3>Your Focus Progress</h3>
                <p style="color: #a3a3a3; margin-bottom: 24px;">Here's what you've accomplished so far</p>
                
                <div style="background: var(--onyx-dark, #064e3b); border-radius: 12px; padding: 20px; margin: 24px 0; display: flex; align-items: center; gap: 16px;">
                    <div style="flex-shrink: 0;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
                            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
                            <line x1="6" x2="6" y1="2" y2="4"/>
                            <line x1="10" x2="10" y1="2" y2="4"/>
                            <line x1="14" x2="14" y1="2" y2="4"/>
                        </svg>
                    </div>
                    <div style="flex: 1; text-align: left;">
                        <div style="font-weight: 600; color: #fff; margin-bottom: 4px; font-size: 16px;">Save your progress</div>
                        <div style="font-size: 14px; color: white; opacity: 0.95;">Sync your tasks and stats across all your devices</div>
                    </div>
                    <button id="guestReportSignupBtn" style="background: white; color: var(--onyx-dark, #064e3b); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap; font-size: 13px;">Sign up</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
                    <!-- Total Focus Hours -->
                    <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; filter: blur(2px); opacity: 0.6;">
                        <div style="color: #a3a3a3; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div style="font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px;">${timeString}</div>
                        <div style="font-size: 14px; color: #a3a3a3;">Focus Time</div>
                    </div>
                    
                    <!-- Completed Cycles -->
                    <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; filter: blur(2px); opacity: 0.6;">
                        <div style="color: #a3a3a3; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        </div>
                        <div style="font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 4px;">${completedCycles}</div>
                        <div style="font-size: 14px; color: #a3a3a3;">Cycles Done</div>
                    </div>
                    
                    <!-- Day Streak - BLURRED -->
                    <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; filter: blur(2px); opacity: 0.6;">
                        <div style="color: #a3a3a3; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                            </svg>
                        </div>
                        <div style="font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 4px;">0</div>
                        <div style="font-size: 14px; color: #a3a3a3;">Day Streak</div>
                    </div>
                    
                    <!-- Longest Streak - BLURRED -->
                    <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; filter: blur(2px); opacity: 0.6;">
                        <div style="color: #a3a3a3; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <div style="font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 4px;">0</div>
                        <div style="font-size: 14px; color: #a3a3a3;">Longest Streak</div>
                    </div>
                </div>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Event listeners
        document.getElementById('guestReportSignupBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            window.location.href = '/pricing';
        });
        
        document.getElementById('closeGuestReportX').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }

    showStatisticsModal() {
        // Get user statistics
        const stats = this.getFocusStats();
        const currentStreak = this.streakData.currentStreak || 0;
        const longestStreak = this.streakData.longestStreak || currentStreak;
        const totalHours = stats.totalHours || 0;
        const completedCycles = stats.completedCycles || 0;
        
        // Format total hours
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);
        const timeString = `${hours}h ${minutes}m`;
        
        // Create statistics modal using upgrade modal styling
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'upgrade-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        
        modal.innerHTML = `
            <button class="close-upgrade-x" id="closeReportX">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="upgrade-content">
                <h3>Focus Report</h3>
                <p>Your productivity summary</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
                    <!-- Day Streak -->
                    <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; text-align: center;">
                        <div style="color: #a3a3a3; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                            </svg>
                        </div>
                        <div style="font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 4px;">${currentStreak}</div>
                        <div style="font-size: 14px; color: #a3a3a3;">Day Streak</div>
                    </div>
                    
                    <!-- Longest Streak -->
                    <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; text-align: center;">
                        <div style="color: #a3a3a3; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <div style="font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 4px;">${longestStreak}</div>
                        <div style="font-size: 14px; color: #a3a3a3;">Longest Streak</div>
                    </div>
                </div>
                
                <!-- Total Focus Hours - Full width below -->
                <div style="margin: 16px 0;">
                    <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; text-align: center;">
                        <div style="color: #a3a3a3; margin-bottom: 12px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div style="font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px;">${timeString}</div>
                        <div style="font-size: 14px; color: #a3a3a3;">Total Focus Hours</div>
                    </div>
                </div>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Add event listeners
        document.getElementById('closeReportX').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }
    
    resetAllData() {
        // Reset focus stats
        localStorage.removeItem('focusStats');
        
        // Reset streak data
        this.streakData = {
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null
        };
        localStorage.removeItem('streakData');
        
        // Update displays
        this.updateFocusHoursDisplay();
        this.updateStreakDisplay();
        
        // Show confirmation
        alert('All focus data has been reset.');
    }

    updateConsecutiveDays(stats) {
        // Kept for backward compatibility when called by legacy flows
        const today = new Date();
        const todayStr = today.toDateString();
        if (!stats.daily) stats.daily = {};
        if ((stats.daily[todayStr] || 0) > 0) {
            if (!stats.lastActiveDate) {
                stats.consecutiveDays = 1;
                stats.lastActiveDate = todayStr;
            }
        }
    }

    updateFocusHoursDisplay() {
        if (this.achievementIcon && this.achievementCounter) {
            const stats = this.getFocusStats();
            const totalMinutes = Math.round((stats.totalHours || 0) * 60); // Convert to minutes
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const timeString = `${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`;
            this.achievementCounter.textContent = timeString;
            this.achievementIcon.classList.add('active');
        }
    }

    showSimpleFocusStats() {
        const stats = this.getFocusStats();
        const totalFocusHours = stats.totalFocusHours || 0;
        const hours = Math.floor(totalFocusHours);
        const minutes = Math.floor((totalFocusHours - hours) * 60);
        const timeString = `${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`;
        
        // Simple alert for now - could be enhanced later
        alert(`Total Focus Time: ${timeString}\nCycles Completed: ${this.calculateCyclesCompleted(stats)}`);
    }


    setupSettingsTabs() {
        const navItems = document.querySelectorAll('.settings-nav-item');
        const tabs = document.querySelectorAll('.settings-tab');
        
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.getAttribute('data-tab');
                
                // Remove active class from all nav items and tabs
                navItems.forEach(nav => nav.classList.remove('active'));
                tabs.forEach(tab => tab.classList.remove('active'));
                
                // Add active class to clicked nav item and corresponding tab
                item.classList.add('active');
                const targetTab = document.getElementById(`${tabName}-tab`);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });
        
        // Setup integration controls in settings
        this.setupTodoistIntegrationControls();
        this.setupNotionIntegrationControls();
        
        
        // Check if user just signed up successfully
        this.checkSignupSuccessRedirect();
        
        // Check if user tried to access Pro feature without subscription
        this.checkProRequiredError();
    }
    
    checkProRequiredError() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error') === 'pro_required') {
            // Only show modal if user is actually not Pro
            // If they're in Developer Mode as Pro, don't show it
            // Clean URL regardless of Pro status
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }



    // Centralized conversion tracking function
    trackConversion(type, value = 1.0, additionalData = {}) {
        console.log(`🎯 Tracking ${type} conversion...`);
        
        try {
            if (typeof gtag === 'undefined') {
                console.warn('⚠️ gtag not available for tracking');
                return false;
            }

            let conversionId;
            let eventName;
            let eventData = {
                'value': value,
                'currency': 'USD',
                ...additionalData
            };

            switch (type) {
                case 'signup':
                    conversionId = 'AW-17614436696/HLp9CM6Plq0bENjym89B';
                    eventName = 'sign_up';
                    eventData.method = 'clerk';
                    eventData.event_category = 'engagement';
                    eventData.event_label = 'user_signup';
                    break;
                case 'subscription':
                    conversionId = 'AW-17614436696/uBZgCNz9pq0bENjym89B';
                    eventName = 'purchase';
                    eventData.transaction_id = 'superfocus_pro_' + Date.now();
                    eventData.event_category = 'ecommerce';
                    eventData.event_label = 'pro_subscription';
                    break;
                default:
                    console.error('❌ Unknown conversion type:', type);
                    return false;
            }

            // Track Google Ads conversion
            gtag('event', 'conversion', {
                'send_to': conversionId,
                'value': value,
                'currency': 'USD'
            });

            // Track Google Analytics event
            gtag('event', eventName, eventData);

            console.log(`✅ ${type} conversion tracked successfully`);
            return true;

        } catch (error) {
            console.error(`❌ Error tracking ${type} conversion:`, error);
            return false;
        }
    }

    checkSignupSuccessRedirect() {
        // Check if user just signed up successfully or completed payment
        const urlParams = new URLSearchParams(window.location.search);
        const signupSuccess = urlParams.get('signup');
        const paymentSuccess = urlParams.get('payment');
        const premiumStatus = urlParams.get('premium');
        
        if (signupSuccess === 'success') {
            // Track successful signup conversion
            this.trackEvent('Signup Success', {
                conversion_type: 'guest_to_signup',
                user_journey: 'guest → signup',
                source: 'clerk_signup',
                timestamp: new Date().toISOString()
            });
            
            // Remove the parameter from URL without page reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            
            // Track signup conversion
            this.trackConversion('signup');
            
            // 🎯 Track User Signup event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackUserSignup('clerk');
                console.log('📊 User signup event tracked to Mixpanel');
            }
            
            // Show success message for signup - DISABLED
            // setTimeout(() => {
            //     this.showSignupSuccessMessage();
            // }, 1000); // Small delay to let the page fully load
        }
        
        if (paymentSuccess === 'success' || premiumStatus === '1') {
            // Track successful subscription conversion
            this.trackEvent('Subscribe Success', {
                conversion_type: 'signup_to_pro',
                user_journey: 'signup → pro',
                source: 'stripe_payment',
                revenue: 9.0,
                timestamp: new Date().toISOString()
            });
            
            // Remove the parameters from URL without page reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            
            // Track subscription conversion immediately
            this.trackConversion('subscription', 9.0);
            
            // 🎯 Track Subscription Upgrade event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackSubscriptionUpgrade('pro');
                console.log('📊 Subscription upgrade event tracked to Mixpanel');
            }
            
            // Show success message for payment and refresh premium status
            setTimeout(() => {
                this.showPaymentSuccessMessage();
                this.updatePremiumUI(); // Refresh premium status
                
                // If user is still not premium after 3 seconds, try to sync manually
                setTimeout(() => {
                    if (!this.isPremium) {
                        console.log('User still not premium after payment, attempting manual sync...');
                        this.attemptPremiumSync();
                    }
                }, 3000);
            }, 1000); // Small delay to let the page fully load
        }
    }

    showSignupSuccessMessage() {
        // Show success notification for signup
        const notification = document.createElement('div');
        notification.className = 'signup-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span>Welcome to Superfocus! Your account has been created successfully.</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showPaymentSuccessMessage() {
        // Note: Conversion tracking is now handled in checkSignupSuccessRedirect()
        // to avoid duplicate tracking
        
        // Show success notification for payment
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span>Payment successful! You now have Pro access to Superfocus.</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    async attemptPremiumSync() {
        try {
            console.log('Attempting to sync premium status...');
            
            // Try to sync premium users from Stripe
            const response = await fetch('/api/sync-premium-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                console.log('Premium sync successful, updating UI...');
                
                // Force Clerk to reload user data
                if (window.Clerk && window.Clerk.user) {
                    try {
                        await window.Clerk.user.reload();
                        console.log('Clerk user data reloaded');
                    } catch (error) {
                        console.log('Could not reload Clerk user:', error);
                    }
                }
                
                // Wait a bit for the sync to complete, then refresh
                setTimeout(() => {
                    this.updateAuthState();
                    this.updatePremiumUI();
                    
                    // Show success notification
                    this.showPremiumSyncSuccessMessage();
                }, 1000);
            } else {
                console.error('Premium sync failed:', response.status);
            }
        } catch (error) {
            console.error('Error during premium sync:', error);
        }
    }
    showPremiumSyncSuccessMessage() {
        // Show success notification for premium sync
        const notification = document.createElement('div');
        notification.className = 'premium-sync-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span>Pro status activated! Welcome to Superfocus Pro.</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }


    setupTodoistIntegrationControls() {
        const connectBtn = document.getElementById('connectTodoistBtn');
        const disconnectBtn = document.getElementById('disconnectTodoistBtn');
        const statusText = document.getElementById('todoistStatusText');
        
        if (!connectBtn || !disconnectBtn || !statusText) return;
        
        connectBtn.addEventListener('click', () => {
            this.trackEvent('Todoist Connect Clicked', {
                button_type: 'todoist_connect',
                source: 'settings_modal',
                user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                conversion_funnel: 'integration_interest'
            });
            // Add user ID to URL for server-side verification
            const userId = window.Clerk?.user?.id || '';
            const viewMode = localStorage.getItem('viewMode');
            
            console.log('🔗 Connecting Todoist:', { 
                userId, 
                viewMode,
                clerkUser: window.Clerk?.user 
            });
            
            // Check if Developer Mode is active
            const devModeParam = viewMode === 'pro' ? '&devMode=pro&bypass=true' : '';
            
            // Let the server verify Pro status - it will redirect with error if not Pro
            window.location.href = `/api/todoist-auth-start?uid=${encodeURIComponent(userId)}${devModeParam}`;
        });

        disconnectBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/todoist-disconnect', { method: 'POST' });
            } catch (_) {}
            statusText.textContent = 'Not connected';
            disconnectBtn.style.display = 'none';
            connectBtn.style.display = '';
            this.todoistTasks = [];
            this.todoistProjectsById = {};
        });

        // Fetch Tasks button removed - tasks are fetched automatically when connected

        // Check connection status and update UI
        (async () => {
            try {
                const resp = await fetch('/api/todoist-status');
                const json = await resp.json();
                const connected = !!json.connected;
                if (connected) {
                    statusText.textContent = 'Connected';
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = '';
                    this.fetchTodoistData();
                } else {
                    statusText.textContent = 'Not connected';
                    connectBtn.style.display = '';
                    disconnectBtn.style.display = 'none';
                }
            } catch (_) {
                statusText.textContent = 'Not connected';
                connectBtn.style.display = '';
                disconnectBtn.style.display = 'none';
            }
        })();
    }

    setupGoogleCalendarIntegrationControls() {
        const connectBtn = document.getElementById('connectGoogleCalendarBtn');
        const disconnectBtn = document.getElementById('disconnectGoogleCalendarBtn');
        const statusText = document.getElementById('googleCalendarStatusText');
        
        if (!connectBtn || !disconnectBtn || !statusText) return;
        
        connectBtn.addEventListener('click', () => {
            // Add user ID to URL for server-side verification
            const userId = window.Clerk?.user?.id || '';
            console.log('Connecting Google Calendar:', { userId, clerkUser: window.Clerk?.user });
            
            // Check if Developer Mode is active
            const viewMode = localStorage.getItem('viewMode');
            const devModeParam = viewMode === 'pro' ? '&devMode=pro' : '';
            
            // Let the server verify Pro status - it will redirect with error if not Pro
            window.location.href = `/api/google-calendar-auth-start?uid=${encodeURIComponent(userId)}${devModeParam}`;
        });

        disconnectBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/google-calendar-disconnect', { method: 'POST' });
            } catch (_) {}
            statusText.textContent = 'Not connected';
            disconnectBtn.style.display = 'none';
            connectBtn.style.display = '';
            this.googleCalendarEvents = [];
        });

        // Check connection status and update UI
        (async () => {
            try {
                const resp = await fetch('/api/google-calendar-status');
                const json = await resp.json();
                const connected = !!json.connected;
                if (connected) {
                    statusText.textContent = 'Connected';
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = '';
                    this.fetchGoogleCalendarData();
                } else {
                    statusText.textContent = 'Not connected';
                    connectBtn.style.display = '';
                    disconnectBtn.style.display = 'none';
                }
            } catch (_) {
                statusText.textContent = 'Not connected';
                connectBtn.style.display = '';
                disconnectBtn.style.display = 'none';
            }
        })();
    }

    setupNotionIntegrationControls() {
        const connectBtn = document.getElementById('connectNotionBtn');
        const disconnectBtn = document.getElementById('disconnectNotionBtn');
        const statusText = document.getElementById('notionStatusText');
        
        if (!connectBtn || !disconnectBtn || !statusText) return;
        
        connectBtn.addEventListener('click', () => {
            this.trackEvent('Notion Connect Clicked', {
                button_type: 'notion_connect',
                source: 'settings_modal',
                user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                conversion_funnel: 'integration_interest'
            });
            // Add user ID to URL for server-side verification
            const userId = window.Clerk?.user?.id || '';
            console.log('Connecting Notion:', { userId, clerkUser: window.Clerk?.user });
            
            // Check if Developer Mode is active
            const viewMode = localStorage.getItem('viewMode');
            const devModeParam = viewMode === 'pro' ? '&devMode=pro' : '';
            
            // Let the server verify Pro status - it will redirect with error if not Pro
            window.location.href = `/api/notion-auth-start?uid=${encodeURIComponent(userId)}${devModeParam}`;
        });

        disconnectBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/notion-disconnect', { method: 'POST' });
            } catch (_) {}
            statusText.textContent = 'Not connected';
            disconnectBtn.style.display = 'none';
            connectBtn.style.display = '';
            this.notionPages = [];
        });

        // Check connection status and update UI
        (async () => {
            try {
                const resp = await fetch('/api/notion-status');
                const json = await resp.json();
                const connected = !!json.connected;
                if (connected) {
                    statusText.textContent = 'Connected';
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = '';
                    this.fetchNotionData();
                } else {
                    statusText.textContent = 'Not connected';
                    connectBtn.style.display = '';
                    disconnectBtn.style.display = 'none';
                }
            } catch (_) {
                statusText.textContent = 'Not connected';
                connectBtn.style.display = '';
                disconnectBtn.style.display = 'none';
            }
        })();
    }

    async fetchGoogleCalendarData() {
        if (!this.isAuthenticated || !this.user || !this.isPremiumUser()) {
            this.googleCalendarEvents = [];
            return;
        }
        try {
            // Check if Developer Mode is active
            const viewMode = localStorage.getItem('viewMode');
            const userId = window.Clerk?.user?.id || '';
            
            // Build query params
            const params = new URLSearchParams();
            if (viewMode === 'pro') params.append('devMode', 'pro');
            if (userId) params.append('uid', userId);
            const queryString = params.toString() ? `?${params.toString()}` : '';
            
            console.log('Fetching Google Calendar data with params:', queryString);
            
            const resp = await fetch(`/api/google-calendar-events${queryString}`);
            if (resp.ok) {
                const events = await resp.json();
                this.googleCalendarEvents = events;
                console.log('Google Calendar events loaded:', events.length);
            } else {
                console.error('Failed to fetch calendar events:', resp.status, await resp.text());
                this.googleCalendarEvents = [];
            }
        } catch (e) {
            console.error('Error fetching Google Calendar data:', e);
            this.googleCalendarEvents = [];
        }
    }

    async fetchNotionData() {
        if (!this.isAuthenticated || !this.user || !this.isPremiumUser()) {
            this.notionPages = [];
            return;
        }
        try {
            // Check if Developer Mode is active
            const viewMode = localStorage.getItem('viewMode');
            const userId = window.Clerk?.user?.id || '';
            
            // Build query params
            const params = new URLSearchParams();
            if (viewMode === 'pro') params.append('devMode', 'pro');
            if (userId) params.append('uid', userId);
            const queryString = params.toString() ? `?${params.toString()}` : '';
            
            console.log('Fetching Notion data with params:', queryString);
            
            const resp = await fetch(`/api/notion-pages${queryString}`);
            if (resp.ok) {
                const pages = await resp.json();
                this.notionPages = pages;
                console.log('Notion pages loaded:', pages.length);
            } else {
                console.error('Failed to fetch Notion pages:', resp.status, await resp.text());
                this.notionPages = [];
            }
        } catch (e) {
            console.error('Error fetching Notion data:', e);
            this.notionPages = [];
        }
    }

    checkAdminAccess() {
        // Only show Developer tab for admin email
        const adminEmail = 'jcjimenezglez@gmail.com';
        const developerNavItem = document.getElementById('developerNavItem');
        
        if (!developerNavItem) return;
        
        // Check if user is authenticated and has admin email
        let isAdmin = false;
        try {
            if (window.Clerk && window.Clerk.user) {
                const userEmail = window.Clerk.user.primaryEmailAddress?.emailAddress || 
                                 window.Clerk.user.emailAddresses?.[0]?.emailAddress || '';
                isAdmin = userEmail.toLowerCase() === adminEmail.toLowerCase();
                console.log('Admin check:', { userEmail, isAdmin });
            }
        } catch (e) {
            console.log('Error checking admin access:', e);
        }
        
        // Show/hide Developer tab based on admin status
        if (isAdmin) {
            developerNavItem.style.display = 'flex';
            console.log('✅ Developer tab shown for admin');
        } else {
            developerNavItem.style.display = 'none';
            console.log('❌ Developer tab hidden for non-admin');
        }
    }

    setupViewModeButtons() {
        const guestModeBtn = document.getElementById('guestModeBtn');
        const freeModeBtn = document.getElementById('freeModeBtn');
        const proModeBtn = document.getElementById('proModeBtn');
        const applyViewModeBtn = document.getElementById('applyViewModeBtn');
        
        // Store selected mode (not applied yet)
        this.selectedViewMode = localStorage.getItem('viewMode') || 'pro';
        
        if (guestModeBtn) {
            guestModeBtn.addEventListener('click', () => {
                this.selectViewMode('guest');
            });
        }
        
        if (freeModeBtn) {
            freeModeBtn.addEventListener('click', () => {
                this.selectViewMode('free');
            });
        }
        
        if (proModeBtn) {
            proModeBtn.addEventListener('click', () => {
                this.selectViewMode('pro');
            });
        }
        
        if (applyViewModeBtn) {
            applyViewModeBtn.addEventListener('click', () => {
                this.applyViewMode();
            });
        }
        
        // Set initial active button based on current view mode
        this.updateViewModeButtons();
    }

    selectViewMode(mode) {
        // Just select the mode, don't apply yet
        this.selectedViewMode = mode;
        this.updateViewModeButtons();
    }

    applyViewMode() {
        const mode = this.selectedViewMode;
        localStorage.setItem('viewMode', mode);
        
        // Close settings modal
        this.hideSettingsModal();
        
        // Apply the selected mode
        if (mode === 'guest') {
            // Simulate guest user - logout completely
            try {
                if (window.Clerk && window.Clerk.signOut) {
                    window.Clerk.signOut();
                }
            } catch (_) {}
            this.isAuthenticated = false;
            this.user = null;
            // Clear Todoist tasks when switching to guest mode
            this.clearTodoistTasks();
            localStorage.removeItem('hasAccount');
            localStorage.setItem('isPremium', 'false');
            localStorage.setItem('hasPaidSubscription', 'false');
            this.updateAuthState();
        } else if (mode === 'free') {
            // Simulate free user - logged in but not premium
            this.isAuthenticated = true;
            this.user = { emailAddresses: [{ emailAddress: 'test@example.com' }] };
            localStorage.setItem('hasAccount', 'true');
            localStorage.setItem('isPremium', 'false');
            localStorage.setItem('hasPaidSubscription', 'false');
            this.updateAuthState();
        } else if (mode === 'pro') {
            // Simulate pro user - logged in and premium
            this.isAuthenticated = true;
            this.user = { emailAddresses: [{ emailAddress: 'test@example.com' }] };
            localStorage.setItem('hasAccount', 'true');
            localStorage.setItem('isPremium', 'true');
            localStorage.setItem('hasPaidSubscription', 'true');
            this.updateAuthState();
        }
    }

    updateViewModeButtons() {
        const currentMode = this.selectedViewMode || localStorage.getItem('viewMode') || 'pro';
        const guestModeBtn = document.getElementById('guestModeBtn');
        const freeModeBtn = document.getElementById('freeModeBtn');
        const proModeBtn = document.getElementById('proModeBtn');
        const currentViewModeText = document.getElementById('currentViewMode');
        
        // Update current mode text
        if (currentViewModeText) {
            currentViewModeText.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        }
        
        // Remove active class from all buttons
        [guestModeBtn, freeModeBtn, proModeBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // Add active class to current mode button
        if (currentMode === 'guest' && guestModeBtn) {
            guestModeBtn.classList.add('active');
        } else if (currentMode === 'free' && freeModeBtn) {
            freeModeBtn.classList.add('active');
        } else if (currentMode === 'pro' && proModeBtn) {
            proModeBtn.classList.add('active');
        }
    }

    calculateWeekHours(stats) {
        if (!stats.daily) return 0;
        
        const today = new Date();
        let weekHours = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            weekHours += stats.daily[dateStr] || 0;
        }
        
        return Math.round(weekHours * 10) / 10;
    }

    calculateCyclesCompleted(stats) {
        // Prefer the real completed cycles counter
        if (stats.completedCycles && stats.completedCycles > 0) {
            return stats.completedCycles;
        }
        // Fallback estimate if user had progress before this feature
        const totalHours = stats.totalHours || 0;
        const avgCycleHours = 2; // reasonable default
        return Math.max(0, Math.floor(totalHours / avgCycleHours));
    }

    getCurrentTechniqueName() {
        const selectedTechnique = localStorage.getItem('selectedTechnique');
        if (selectedTechnique === 'custom') {
            const savedCustomTimer = localStorage.getItem('customTimer');
            if (savedCustomTimer) {
                try {
                    const customConfig = JSON.parse(savedCustomTimer);
                    return customConfig.name || 'Custom Timer';
                } catch (_) {
                    return 'Custom Timer';
                }
            }
            return 'Custom Timer';
        }
        
        const techniqueMap = {
            'pomodoro': 'Pomodoro',
            'pomodoro-plus': 'Long Pomodoro',
            'ultradian-rhythm': 'Ultradian Rhythm'
        };
        
        return techniqueMap[selectedTechnique] || 'Pomodoro';
    }

    getMostUsedTechnique(stats) {
        // Prefer accumulated technique time (focus + breaks)
        if (stats.techniqueTime && Object.keys(stats.techniqueTime).length > 0) {
            let mostUsed = '';
            let maxHours = -1;
            for (const [technique, hours] of Object.entries(stats.techniqueTime)) {
                if (hours > maxHours) {
                    maxHours = hours;
                    mostUsed = technique;
                }
            }
            return mostUsed || this.getCurrentTechniqueName();
        }

        // Fallback to count-based usage if old data
        if (stats.techniqueUsage && Object.keys(stats.techniqueUsage).length > 0) {
            let mostUsed = '';
            let maxCount = -1;
            for (const [technique, count] of Object.entries(stats.techniqueUsage)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostUsed = technique;
                }
            }
            return mostUsed || this.getCurrentTechniqueName();
        }

        return this.getCurrentTechniqueName();
    }

    initializeCycleCounter() {
        if (this.isAuthenticated && this.achievementCounter) {
            this.updateFocusHoursDisplay();
        }
    }

    showTechniqueInfo(technique) {
        // Handle custom timer configuration
        if (technique === 'custom') {
            this.showCustomTimerModal();
            return;
        }
        
        const techniqueInfo = {
            'pomodoro': {
                title: 'Pomodoro Technique',
                description: 'The Pomodoro Technique is a time management method developed by Francesco Cirillo. It uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks. After 4 pomodoros, take a longer break of 15-30 minutes.',
                benefits: [
                    'Improves focus and concentration',
                    'Reduces mental fatigue',
                    'Increases productivity',
                    'Helps manage time effectively'
                ],
                videoId: 'IlU-zDU6aQ0'
            },
            'pomodoro-plus': {
                title: 'Long Pomodoro',
                description: 'An extended version of the Pomodoro Technique with longer work sessions. Perfect for deep work and complex tasks that require sustained attention. The 50-minute focus periods allow for deeper immersion in your work.',
                benefits: [
                    'Better for deep work sessions',
                    'Reduces context switching',
                    'Ideal for complex projects',
                    'Maintains focus for longer periods'
                ],
                videoId: 'bmnoNm64ovI'
            },
            'ultradian-rhythm': {
                title: 'Ultradian Rhythm',
                description: 'Based on natural biological rhythms, the Ultradian Rhythm technique aligns with your body\'s natural energy cycles. Work for 90 minutes followed by a 20-minute break to match your natural attention span.',
                benefits: [
                    'Aligns with natural body rhythms',
                    'Optimizes energy levels',
                    'Reduces mental fatigue',
                    'Enhances cognitive performance'
                ],
                videoId: 'lsODSDmY4CY'
            }
        };

        const info = techniqueInfo[technique];
        if (!info) return;

        // Create modal content
        const modalContent = `
            <div class="technique-info-modal">
                <button class="close-technique-info-x">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                    </svg>
                </button>
                <h3>${info.title}</h3>
                <p class="technique-description">${info.description}</p>
                <div class="technique-video">
                    <iframe 
                        width="100%" 
                        height="200" 
                        src="https://www.youtube.com/embed/${info.videoId}" 
                        title="${info.title} Video"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="technique-benefits">
                    <h4>Benefits:</h4>
                    <ul>
                        ${info.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                    </ul>
                </div>
                <button class="close-technique-info">Got it</button>
            </div>
        `;

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'technique-info-overlay';
        modalOverlay.innerHTML = modalContent;
        document.body.appendChild(modalOverlay);

        // Show modal
        modalOverlay.style.display = 'flex';

        // Close modal functionality
        const closeBtn = modalOverlay.querySelector('.close-technique-info');
        const closeBtnX = modalOverlay.querySelector('.close-technique-info-x');
        
        closeBtn.addEventListener('click', (evt) => {
            // Prevent this click from bubbling to document listener
            evt.stopPropagation();
            document.body.removeChild(modalOverlay);
            // Keep dropdown open after closing modal
            if (this.techniqueDropdown) {
                this.techniqueDropdown.classList.add('open');
            }
        });
        
        closeBtnX.addEventListener('click', (evt) => {
            // Prevent this click from bubbling to document listener
            evt.stopPropagation();
            document.body.removeChild(modalOverlay);
            // Keep dropdown open after closing modal
            if (this.techniqueDropdown) {
                this.techniqueDropdown.classList.add('open');
            }
        });

        modalOverlay.addEventListener('click', (e) => {
            // Prevent bubbling for any click inside the modal content
            const inModal = e.target.closest && e.target.closest('.technique-info-modal');
            if (inModal) {
                e.stopPropagation();
                return;
            }
            if (e.target === modalOverlay) {
                e.stopPropagation();
                document.body.removeChild(modalOverlay);
                // Keep dropdown open after closing modal
                if (this.techniqueDropdown) {
                this.techniqueDropdown.classList.add('open');
            }
            }
        });

        // Initialize integration controls for Spotify similar to Todoist
        this.setupSpotifyIntegrationControls();
    }

    setupSpotifyIntegrationControls() {
        try {
            const connectBtn = document.getElementById('connectSpotifyBtn');
            const disconnectBtn = document.getElementById('disconnectSpotifyBtn');
            const openBtn = document.getElementById('openSpotifyModalBtn');
            const statusText = document.getElementById('spotifyStatusText');

            if (!connectBtn || !disconnectBtn || !openBtn || !statusText) return;

            const refreshStatus = async () => {
                try {
                    const resp = await fetch('/api/spotify-status');
                    const data = await resp.json();
                    if (data.connected) {
                        statusText.textContent = 'Connected';
                        connectBtn.style.display = 'none';
                        disconnectBtn.style.display = '';
                        openBtn.style.display = '';
                    } else {
                        statusText.textContent = 'Not connected';
                        connectBtn.style.display = '';
                        disconnectBtn.style.display = 'none';
                        openBtn.style.display = 'none';
                    }
                } catch (_) {
                    statusText.textContent = 'Not connected';
                    connectBtn.style.display = '';
                    disconnectBtn.style.display = 'none';
                    openBtn.style.display = 'none';
                }
            };

            connectBtn.addEventListener('click', async () => {
                window.location.href = '/api/spotify-auth-start';
            });

            disconnectBtn.addEventListener('click', async () => {
                await fetch('/api/spotify-disconnect');
                refreshStatus();
            });

            openBtn.addEventListener('click', () => {
                this.showSpotifyModal();
            });

            refreshStatus();
        } catch (_) {}
    }

    showSpotifyModal() {
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';

        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.style.maxWidth = '720px';
        modal.innerHTML = `
            <button class="close-focus-stats-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <h3>Spotify</h3>
            <div class="spotify-content">
                <div class="spotify-devices" id="spotifyDevices"></div>
                <div class="spotify-playlists" id="spotifyPlaylists"></div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => { try { document.body.removeChild(overlay); } catch (_) {} };
        modal.querySelector('.close-focus-stats-x').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // Load devices and playlists
        this.loadSpotifyDevices(modal);
        this.loadSpotifyPlaylists(modal);
    }

    async loadSpotifyDevices(modal) {
        const el = modal.querySelector('#spotifyDevices');
        try {
            const resp = await fetch('/api/spotify-devices');
            const data = await resp.json();
            const devices = data.devices || [];
            el.innerHTML = '<h4>Devices</h4>' + (devices.length ? devices.map(d => `<div class="device" data-id="${d.id}">${d.is_active ? '• ' : ''}${d.name}</div>`).join('') : '<div>No devices found. Open Spotify on a device.</div>');
        } catch (e) {
            el.innerHTML = '<div>Failed to load devices</div>';
        }
    }

    async loadSpotifyPlaylists(modal) {
        const el = modal.querySelector('#spotifyPlaylists');
        try {
            const resp = await fetch('/api/spotify-playlists');
            const data = await resp.json();
            const items = data.items || [];
            el.innerHTML = '<h4>Playlists</h4>' + (items.length ? items.map(p => `<div class="playlist" data-uri="${p.uri}">${p.name}</div>`).join('') : '<div>No playlists</div>');

            el.querySelectorAll('.playlist').forEach(pl => {
                pl.addEventListener('click', async () => {
                    const uri = pl.getAttribute('data-uri');
                    // Find active device if any
                    let deviceId = '';
                    try {
                        const devResp = await fetch('/api/spotify-devices');
                        const devData = await devResp.json();
                        const active = (devData.devices || []).find(d => d.is_active) || (devData.devices || [])[0];
                        if (active) deviceId = active.id;
                    } catch (_) {}
                    await fetch('/api/spotify-play', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: deviceId, context_uri: uri }) });
                });
            });
        } catch (e) {
            el.innerHTML = '<div>Failed to load playlists</div>';
        }
    }

    setupSpotifyInModal(modalOverlay) {}

    initSpotifyWebPlayerIfNeeded() {}

    async loadSpotifyDevicesInModal() {}

    async loadSpotifyPlaylistsInModal() {}

    async playSpotifyUri() {}

    async pauseSpotify() {}

    showCustomTimerModal() {
        // Load saved custom timer data if it exists
        const savedCustomTimer = localStorage.getItem('customTimer');
        if (savedCustomTimer) {
            try {
                const customConfig = JSON.parse(savedCustomTimer);
                console.log('Loading custom timer for editing:', customConfig);
                
                // Populate form fields with saved values
                document.getElementById('customName').value = customConfig.name || '';
                document.getElementById('focusTime').value = Math.round(customConfig.focusTime / 60) || 25;
                document.getElementById('breakTime').value = Math.round(customConfig.breakTime / 60) || 5;
                document.getElementById('longBreakTime').value = Math.round(customConfig.longBreakTime / 60) || 0;
                document.getElementById('cycles').value = customConfig.cycles || 4;
            } catch (error) {
                console.error('Error loading custom timer for editing:', error);
                // Reset to default values if there's an error
                this.resetCustomTimerForm();
            }
        } else {
            // Reset to default values if no saved timer
            this.resetCustomTimerForm();
        }
        
        this.customTimerModal.style.display = 'flex';
        // Keep dropdown open
        if (this.techniqueDropdown) {
                this.techniqueDropdown.classList.add('open');
            }
        
        // Add real-time validation
        this.setupCustomTimerValidation();
    }

    hideCustomTimerModal() {
        this.customTimerModal.style.display = 'none';
        // Keep dropdown open
        if (this.techniqueDropdown) {
                this.techniqueDropdown.classList.add('open');
            }
    }

    resetCustomTimerForm() {
        document.getElementById('customName').value = '';
        document.getElementById('focusTime').value = 25;
        document.getElementById('breakTime').value = 5;
        document.getElementById('longBreakTime').value = 0;
        document.getElementById('cycles').value = 4;
    }

    setupCustomTimerValidation() {
        const customNameInput = document.getElementById('customName');
        const focusTimeInput = document.getElementById('focusTime');
        const breakTimeInput = document.getElementById('breakTime');
        const longBreakTimeInput = document.getElementById('longBreakTime');
        const cyclesInput = document.getElementById('cycles');
        const saveButton = document.getElementById('saveCustomTimer');

        // Function to check all validations and enable/disable save button
        const validateAll = () => {
            const name = customNameInput.value.trim();
            const focusTime = parseInt(focusTimeInput.value) || 0;
            const breakTime = parseInt(breakTimeInput.value) || 0;
            const longBreakTime = parseInt(longBreakTimeInput.value) || 0;
            const cycles = parseInt(cyclesInput.value) || 0;

            const hasErrors = 
                name.length === 0 || name.length > 10 ||
                focusTime < 1 || focusTime > 180 ||
                breakTime < 1 || breakTime > 60 ||
                longBreakTime < 0 || longBreakTime > 60 ||
                cycles < 1 || cycles > 10;

            saveButton.disabled = hasErrors;
        };

        // Custom Name validation (max 10 characters)
        customNameInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const errorElement = document.getElementById('customNameError');
            
            if (value.length > 10) {
                e.target.classList.add('error');
                errorElement.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                errorElement.style.display = 'none';
            }
            validateAll();
        });

        // Focus Time validation (max 180)
        focusTimeInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const errorElement = document.getElementById('focusTimeError');
            
            if (value > 180) {
                e.target.classList.add('error');
                errorElement.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                errorElement.style.display = 'none';
            }
            validateAll();
        });

        // Break Time validation (max 60)
        breakTimeInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const errorElement = document.getElementById('breakTimeError');
            
            if (value > 60) {
                e.target.classList.add('error');
                errorElement.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                errorElement.style.display = 'none';
            }
            validateAll();
        });

        // Long Break Time validation (max 60)
        longBreakTimeInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const errorElement = document.getElementById('longBreakTimeError');
            
            if (value > 60) {
                e.target.classList.add('error');
                errorElement.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                errorElement.style.display = 'none';
            }
            validateAll();
        });

        // Cycles validation (max 10)
        cyclesInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const errorElement = document.getElementById('cyclesError');
            
            if (value > 10) {
                e.target.classList.add('error');
                errorElement.style.display = 'block';
            } else {
                e.target.classList.remove('error');
                errorElement.style.display = 'none';
            }
            validateAll();
        });

        // Initial validation
        validateAll();
    }
    saveCustomTimerConfig() {
        const name = document.getElementById('customName').value.trim();
        const focusTime = parseInt(document.getElementById('focusTime').value);
        const breakTime = parseInt(document.getElementById('breakTime').value);
        const longBreakTime = parseInt(document.getElementById('longBreakTime').value);
        const cycles = parseInt(document.getElementById('cycles').value);

        // Check for validation errors
        const hasErrors = document.querySelectorAll('.form-group input.error').length > 0;
        if (hasErrors) {
            alert('Please fix the validation errors before saving');
            return;
        }

        // Validation
        if (!name) {
            alert('Please enter a timer name');
            return;
        }

        if (name.length > 10) {
            alert('Timer name must be 10 characters or less');
            return;
        }

        if (focusTime < 1 || focusTime > 180) {
            alert('Focus time must be between 1 and 180 minutes');
            return;
        }

        if (breakTime < 1 || breakTime > 60) {
            alert('Break time must be between 1 and 60 minutes');
            return;
        }

        if (longBreakTime < 0 || longBreakTime > 60) {
            alert('Long break time must be between 0 and 60 minutes');
            return;
        }

        if (cycles < 1 || cycles > 10) {
            alert('Number of cycles must be between 1 and 10');
            return;
        }

        // Save custom timer configuration
        const customConfig = {
            name: name,
            focusTime: focusTime * 60, // Convert to seconds
            breakTime: breakTime * 60,
            longBreakTime: longBreakTime * 60,
            cycles: cycles
        };

        localStorage.setItem('customTimer', JSON.stringify(customConfig));

        // Load the custom timer
        this.loadCustomTechnique(customConfig);
        
        // Close modal and dropdown
        this.hideCustomTimerModal();
        this.closeDropdown();
    }

    loadCustomTechnique(config) {
        this.workTime = config.focusTime;
        this.shortBreakTime = config.breakTime;
        this.longBreakTime = config.longBreakTime;
        
        // Build cycle sections
        this.cycleSections = [];
        for (let i = 0; i < config.cycles; i++) {
            this.cycleSections.push({
                type: 'work',
                duration: this.workTime,
                name: 'Focus'
            });
            this.cycleSections.push({
                type: 'break',
                duration: this.shortBreakTime,
                name: 'Break'
            });
        }
        
        // Add long break if configured
        if (this.longBreakTime > 0) {
            this.cycleSections.push({
                type: 'long-break',
                duration: this.longBreakTime,
                name: 'Long Break'
            });
        }

        // Calculate required focus time for complete cycle
        this.calculateRequiredFocusTime();

        // Update UI
        if (this.techniqueTitle) {
            // Preserve the chevron icon when updating the title
            const chevronIcon = this.techniqueTitle.querySelector('svg');
            this.techniqueTitle.innerHTML = config.name;
            if (chevronIcon) {
                this.techniqueTitle.appendChild(chevronIcon);
            }
        }
        if (this.techniqueDescription) {
            this.techniqueDescription.textContent = `${config.focusTime/60} min focus, ${config.breakTime/60} min break${this.longBreakTime > 0 ? `, ${this.longBreakTime/60} min long break` : ''}`;
        }
        
        // Update dropdown item to show custom name
        const customItem = document.querySelector('[data-technique="custom"]');
        if (customItem) {
            const titleElement = customItem.querySelector('.item-title');
            const descElement = customItem.querySelector('.item-description');
            if (titleElement) titleElement.textContent = config.name;
            if (descElement) descElement.textContent = `${config.focusTime/60} min focus, ${config.breakTime/60} min break${this.longBreakTime > 0 ? `, ${this.longBreakTime/60} min long break` : ''}`;
        }
        
        // Mark custom timer as selected and unmark others
        this.markTechniqueAsSelected('custom');
        
        // Save custom technique as selected
        localStorage.setItem('selectedTechnique', 'custom');
        
        // Reset to first section
        this.currentSection = 1;
        this.timeLeft = this.cycleSections[0].duration;
        this.isWorkSession = this.cycleSections[0].type === 'work';
        this.isLongBreak = this.cycleSections[0].type === 'long-break';
        
        // Update progress ring and display
        this.updateProgressRing();
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateSessionInfo();
        
        // Close dropdown
        this.closeDropdown();
    }

    markTechniqueAsSelected(technique) {
        // Remove selected class from all dropdown items
        const allItems = document.querySelectorAll('.dropdown-item');
        allItems.forEach(item => item.classList.remove('selected'));
        
        // Add selected class to the specified technique
        const selectedItem = document.querySelector(`[data-technique="${technique}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    loadSavedCustomTimer() {
        const savedCustomTimer = localStorage.getItem('customTimer');
        if (!savedCustomTimer) return;
        try {
            const customConfig = JSON.parse(savedCustomTimer);
            // Only update the dropdown item's text so the user sees their custom config
            const customItem = document.querySelector('[data-technique="custom"]');
            if (customItem) {
                const titleElement = customItem.querySelector('.item-title');
                const descElement = customItem.querySelector('.item-description');
                if (titleElement) titleElement.textContent = customConfig.name;
                if (descElement) descElement.textContent = `${customConfig.focusTime/60} min focus, ${customConfig.breakTime/60} min break${customConfig.longBreakTime > 0 ? `, ${customConfig.longBreakTime/60} min long break` : ''}`;
            }
            // Do NOT auto-select here. Selection is handled by loadLastSelectedTechnique()
        } catch (error) {
            console.error('Error reading custom timer:', error);
            localStorage.removeItem('customTimer');
        }
    }

    loadLastSelectedTechnique() {
        const lastSelectedTechnique = localStorage.getItem('selectedTechnique');
        const savedCustomTimer = localStorage.getItem('customTimer');
        
        // If the last selected was custom and we have a saved config, load it
        if (lastSelectedTechnique === 'custom') {
            if (savedCustomTimer) {
                try {
                    const customConfig = JSON.parse(savedCustomTimer);
                    this.loadCustomTechnique(customConfig);
                    return;
                } catch (e) {
                    console.error('Invalid custom timer config, defaulting to Pomodoro');
                    localStorage.removeItem('customTimer');
                }
            }
            // If no valid custom config, fall back to default
            this.loadDefaultTechnique();
            return;
        }

        // If the last selected is a built-in technique
        if (lastSelectedTechnique) {
            const techniqueItem = document.querySelector(`[data-technique="${lastSelectedTechnique}"]`);
            if (techniqueItem) {
                this.selectTechnique(techniqueItem);
                return;
            }
        }

        // Default when nothing saved or item not found
        this.loadDefaultTechnique();
    }

    loadDefaultTechnique() {
        const pomodoroItem = document.querySelector('[data-technique="pomodoro"]');
        if (pomodoroItem) {
            this.selectTechnique(pomodoroItem);
        }
    }
    
    setDefaultTechniqueForGuest() {
        // Set Pomodoro as selected in the main technique dropdown for guest users
        if (this.techniqueTitle) {
            this.techniqueTitle.innerHTML = `Pomodoro<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
        }
        
        // Mark Pomodoro as selected in dropdown items
        if (this.dropdownItems) {
            this.dropdownItems.forEach(item => {
                item.classList.remove('selected');
                if (item.dataset.technique === 'pomodoro') {
                    item.classList.add('selected');
                }
            });
        }
        
        // Set current technique key
        this.currentTechniqueKey = 'pomodoro';
        
        // For guest users, ensure Pomodoro stays active in settings panel
        // Don't remove the active class that's already in the HTML
        console.log('✅ Pomodoro set as default technique for guest user');
    }
    

    pauseSpotify() {
        // Implement logic to pause Spotify playback
        console.log('Spotify paused');
    }

    playSpotifyUri(uri) {
        // Implement logic to play a specific Spotify URI
        console.log('Playing Spotify URI:', uri);
    }

    // Show keyboard shortcut hint (only once per session)
    showKeyboardHint() {
        // Only show hint once per session
        if (sessionStorage.getItem('keyboardHintShown')) return;
        
        // Create hint tooltip
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint';
        hint.innerHTML = `
            <span>💡 Tip: Press <kbd>R</kbd> to reset timer</span>
        `;
        
        document.body.appendChild(hint);
        
        // Function to position hint above Play/Pause button
        const positionHint = () => {
            if (!this.startPauseBtn) return;
            const buttonRect = this.startPauseBtn.getBoundingClientRect();
            const hintRect = hint.getBoundingClientRect();
            
            // Position above the button, centered horizontally
            const left = buttonRect.left + (buttonRect.width / 2) - (hintRect.width / 2);
            const top = buttonRect.top - hintRect.height - 20; // 20px gap above button
            
            hint.style.left = `${left}px`;
            hint.style.top = `${top}px`;
        };
        
        // Position initially
        setTimeout(() => {
            positionHint();
            hint.classList.add('show');
        }, 100);
        
        // Update position on window resize
        const resizeHandler = () => positionHint();
        window.addEventListener('resize', resizeHandler);
        
        // Hide after 4 seconds
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => {
                hint.remove();
                window.removeEventListener('resize', resizeHandler);
            }, 300);
        }, 4000);
        
        // Mark as shown for this session
        sessionStorage.setItem('keyboardHintShown', 'true');
    }


    // Save timer state to sessionStorage (persists on reload/navigation but not on tab close)
    saveTimerState() {
        // Save state as soon as timer has any progress
        const section = this.cycleSections[this.currentSection - 1];
        if (!section) return;
        
        const sectionDuration = section.duration;
        const timeElapsed = sectionDuration - this.timeLeft;
        
        // Don't save if less than 1 second has elapsed
        if (timeElapsed < 1) return;
        
        // Don't save if in "Ready to focus" state
        const isAtInitialTime = this.timeLeft === sectionDuration;
        if (!this.isRunning && isAtInitialTime && this.isWorkSession) return;
        
        const state = {
            currentSection: this.currentSection,
            timeLeft: this.timeLeft,
            isRunning: this.isRunning, // Save actual running state
            isWorkSession: this.isWorkSession,
            isLongBreak: this.isLongBreak,
            currentTaskIndex: this.currentTaskIndex,
            currentTaskName: this.currentTaskName,
            selectedTechnique: this.selectedTechnique?.name || 'Pomodoro',
            selectedTheme: this.currentTheme || 'lofi', // Save current theme
            timestamp: Date.now(),
            sectionDuration: sectionDuration,
            timeElapsed: timeElapsed
        };
        
        sessionStorage.setItem('timerState', JSON.stringify(state));
    }

    // Load timer state from sessionStorage (persists on reload/navigation but not on tab close)
    loadTimerState() {
        // Only restore session for authenticated users
        if (!this.isAuthenticated) {
            sessionStorage.removeItem('timerState');
            return false;
        }
        
        const savedState = sessionStorage.getItem('timerState');
        if (!savedState) return false;
        
        try {
            const state = JSON.parse(savedState);
            
            // Check if state is recent (within last 30 minutes)
            const timeDiff = Date.now() - state.timestamp;
            if (timeDiff > 30 * 60 * 1000) {
                sessionStorage.removeItem('timerState');
                return false;
            }
            
            // Check if at least 1 second had elapsed when saved
            if (state.timeElapsed < 1) {
                sessionStorage.removeItem('timerState');
                return false;
            }
            
            // Check if window was closed (sessionStorage cleared) vs just refreshed
            const windowClosed = !sessionStorage.getItem('windowActive');
            if (windowClosed) {
                console.log('Window was closed, resetting timer');
                sessionStorage.removeItem('timerState');
                return false;
            }
            
            // Always continue session without modal (window was not closed)
            console.log('Continuing session automatically (window not closed)');
            this.restoreTimerState(state);
            
            return true;
        } catch (error) {
            console.error('Error loading timer state:', error);
            sessionStorage.removeItem('timerState');
            return false;
        }
    }


    // Restore timer state
    restoreTimerState(state) {
        // Restore technique if different
        if (state.selectedTechnique !== this.selectedTechnique?.name) {
            const techniqueItem = Array.from(document.querySelectorAll('.technique-item'))
                .find(item => item.dataset.technique === state.selectedTechnique);
            if (techniqueItem) {
                this.selectTechnique(techniqueItem);
            }
        }
        
        // Restore state
        this.currentSection = state.currentSection;
        this.timeLeft = state.timeLeft;
        this.isWorkSession = state.isWorkSession;
        this.isLongBreak = state.isLongBreak;
        this.currentTaskIndex = state.currentTaskIndex;
        this.currentTaskName = state.currentTaskName;
        
        // Restore theme if it was saved in the state
        if (state.selectedTheme) {
            console.log('🎨 Restoring theme from saved state:', state.selectedTheme);
            this.applyTheme(state.selectedTheme);
        }
        
        // Always restore as paused (user decides when to continue)
        this.isRunning = false;
        
        // Update UI
        this.updateDisplay();
        this.updateProgressRing();
        this.updateProgress();
        this.updateSessionInfo();
        this.updateNavigationButtons();
        this.updateCurrentTaskFromQueue();
        
        // Show user that timer was paused due to refresh
        if (state.isRunning) {
            console.log('Timer was running, paused due to refresh - user can resume when ready');
        }
        
        // Clear saved state
        sessionStorage.removeItem('timerState');
        
        console.log('Timer state restored successfully:', {
            section: this.currentSection,
            timeLeft: this.timeLeft,
            technique: state.selectedTechnique,
            wasRunning: state.isRunning,
            restoredAsPaused: true
        });
    }

    // Clear timer state from sessionStorage
    clearTimerState() {
        sessionStorage.removeItem('timerState');
    }

    // Show reset confirmation modal
    showResetConfirmationModal() {
        // Don't show if timer is at initial state
        const section = this.cycleSections[this.currentSection - 1];
        if (!section) return;
        
        const sectionDuration = section.duration;
        const timeElapsed = sectionDuration - this.timeLeft;
        
        // If less than 1 second elapsed, just reset without confirmation
        if (timeElapsed < 1) {
            this.resetTimer();
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'upgrade-modal-overlay';
        overlay.style.display = 'flex';
        
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal reset-confirmation-modal';
        modal.innerHTML = `
            <button class="close-upgrade-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="upgrade-content">
                <div class="upgrade-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                </div>
                <h3>Reset Timer?</h3>
                <p>Are you sure you want to reset the timer? Your current progress will be lost.</p>
                <div class="upgrade-buttons">
                    <button class="upgrade-btn" id="confirmResetBtn">Yes, Reset</button>
                    <button class="cancel-btn" id="cancelResetBtn">Cancel</button>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event listeners
        setTimeout(() => {
            const closeBtn = modal.querySelector('.close-upgrade-x');
            const confirmBtn = modal.querySelector('#confirmResetBtn');
            const cancelBtn = modal.querySelector('#cancelResetBtn');
            
            const close = () => {
                overlay.remove();
            };
            
            const confirmReset = () => {
                this.resetTimer();
                overlay.remove();
            };
            
            if (closeBtn) closeBtn.addEventListener('click', close);
            if (cancelBtn) cancelBtn.addEventListener('click', close);
            if (confirmBtn) confirmBtn.addEventListener('click', confirmReset);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close();
            });
        }, 100);
    }
    
    // Render tasks in side panel - use exact same logic as showTaskListModal
    renderTasksInSidePanel() {
        console.log('🔵 renderTasksInSidePanel called');
        const panel = document.getElementById('taskSidePanel');
        if (!panel) {
            console.error('❌ Panel not found!');
            return;
        }
        console.log('✅ Panel found:', panel);
        
        // Check if user is authenticated and show/hide sections accordingly
        const isFreeUser = this.isAuthenticated && this.user && !this.isPremiumUser();
        const isGuest = !this.isAuthenticated || !this.user;
        
        // Show/hide sections based on user status
        const importSection = document.getElementById('importTodoistSection');
        
        if (importSection) {
            importSection.style.display = (this.isAuthenticated && this.user && this.isPremiumUser()) ? 'block' : 'none';
        }
        
        const listEl = panel.querySelector('#todoistTasksList');
        console.log('🔵 listEl:', listEl);
        
        // Detect current active tab from DOM
        const activeTabEl = panel.querySelector('.task-tab.active');
        let currentTab = activeTabEl ? activeTabEl.dataset.tab : 'todo'; // Default to todo tab
        
        const renderTasks = () => {
            console.log('🔵 renderTasks called, currentTab:', currentTab);
            
            // Clear only task items and headers, preserve the form
            const taskItems = listEl.querySelectorAll('.task-item, .empty-state, .task-source-header');
            taskItems.forEach(item => item.remove());
            
            const allTasks = this.getAllTasks();
            
            // Filter tasks based on current tab
            let filteredTasks = allTasks;
            if (currentTab === 'todo') {
                filteredTasks = allTasks.filter(task => !task.completed);
            } else if (currentTab === 'done') {
                filteredTasks = allTasks.filter(task => task.completed);
            }
            
            if (filteredTasks.length === 0) {
                if (currentTab === 'done') {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.innerHTML = `
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                            </svg>
                        </div>
                        <div class="empty-text">No completed tasks yet</div>
                        <div class="empty-subtext">Complete some tasks to see them here</div>
                    `;
                    listEl.appendChild(emptyState);
                }
                return;
            }
            
            // Group tasks by source
            const tasksBySource = {
                'local': [],
                'todoist': [],
                'notion': []
            };
            
            filteredTasks.forEach(task => {
                const source = task.source || 'local';
                if (tasksBySource[source]) {
                    tasksBySource[source].push(task);
                } else {
                    tasksBySource['local'].push(task);
                }
            });
            
            // Apply saved task order within each source
            const savedOrder = this.getTaskOrder();
            Object.keys(tasksBySource).forEach(source => {
                const tasks = tasksBySource[source];
                if (savedOrder.length > 0 && tasks.length > 0) {
                    const taskMap = new Map(tasks.map(task => [task.id, task]));
                    const orderedTasks = [];
                    savedOrder.forEach(orderItem => {
                        if (taskMap.has(orderItem.id)) {
                            orderedTasks.push(taskMap.get(orderItem.id));
                            taskMap.delete(orderItem.id);
                        }
                    });
                    taskMap.forEach(task => orderedTasks.push(task));
                    tasksBySource[source] = orderedTasks;
                }
            });
            
            // Get the form element to insert before it (if it exists)
            const addTaskFormEl = listEl.querySelector('#addTaskForm');
            
            // Source labels
            const sourceConfig = {
                'local': { label: 'My Tasks' },
                'todoist': { label: 'From Todoist' },
                'notion': { label: 'From Notion' }
            };
            
            // Check how many sources have tasks
            const sourcesWithTasks = Object.keys(tasksBySource).filter(source => tasksBySource[source].length > 0);
            const showHeaders = sourcesWithTasks.length > 1 || (sourcesWithTasks.length === 1 && sourcesWithTasks[0] !== 'local');
            
            // Render tasks grouped by source
            let globalIndex = 0;
            ['local', 'todoist', 'notion'].forEach(source => {
                const tasks = tasksBySource[source];
                if (tasks.length === 0) return;
                
                // Create source header (only if needed)
                if (showHeaders) {
                    const sourceHeader = document.createElement('div');
                    sourceHeader.className = 'task-source-header';
                    const config = sourceConfig[source];
                    sourceHeader.innerHTML = `
                        <span class="source-label">${config.label}</span>
                        <span class="source-count">${tasks.length}</span>
                    `;
                    
                    // Insert before the form if it exists, otherwise append
                    if (addTaskFormEl) {
                        listEl.insertBefore(sourceHeader, addTaskFormEl);
                    } else {
                        listEl.appendChild(sourceHeader);
                    }
                }
                
                // Render tasks for this source
                tasks.forEach((task) => {
                    const item = document.createElement('div');
                    item.className = 'task-item';
                    item.draggable = true;
                    item.dataset.taskId = task.id;
                    item.dataset.index = globalIndex++;
                    item.dataset.source = source;
                    
                    const taskConfig = this.getTaskConfig(task.id);
                    const sessions = taskConfig.sessions || 1;
                    const completedSessions = taskConfig.completedSessions || 0;
                    const totalSessions = taskConfig.sessions || 1;
                    const isCompleted = task.completed || (completedSessions >= totalSessions);
                    
                    // Check if task should be disabled for Guest users
                    const isGuest = !this.isAuthenticated || !this.user;
                    const shouldDisableForGuest = isGuest && globalIndex > 1; // Disable tasks 2+ for guests
                    
                    const itemContent = `
                        <div class="task-checkbox">
                            <input type="checkbox" id="task-${task.id}" ${isCompleted ? 'checked' : ''} ${shouldDisableForGuest ? 'disabled' : ''}>
                            <label for="task-${task.id}"></label>
                        </div>
                        <div class="task-content">
                            <div class="task-title" style="${shouldDisableForGuest ? 'opacity: 0.5;' : ''}">
                                ${task.content || '(untitled)'}
                                ${shouldDisableForGuest ? '<span style="font-size: 12px; margin-left: 8px;">(Sign up required)</span>' : ''}
                            </div>
                        </div>
                        <div class="task-progress">
                            <span class="progress-text" style="${shouldDisableForGuest ? 'opacity: 0.5;' : ''}">${completedSessions}/${totalSessions}</span>
                        </div>
                        ${!isCompleted && !shouldDisableForGuest ? `
                        <div class="task-menu" data-task-id="${task.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                            </svg>
                        </div>
                        ` : ''}
                    `;
                    
                    item.innerHTML = itemContent;
                    
                    // Add disabled class for guest users
                    if (shouldDisableForGuest) {
                        item.classList.add('disabled-for-guest');
                    }
                    
                    // Add completed class if task is completed
                    if (isCompleted) {
                        item.classList.add('completed');
                    }
                    
                    // Only apply 'selected' class if task is NOT completed
                    if (taskConfig.selected && !isCompleted) {
                        item.classList.add('selected');
                    }
                    
                    // Insert before the form if it exists, otherwise append
                    if (addTaskFormEl) {
                        listEl.insertBefore(item, addTaskFormEl);
                    } else {
                        listEl.appendChild(item);
                    }
                });
            });
            
            this.setupTaskEventListeners(panel);
            this.setupDragAndDrop(panel);
            
            // Setup task menu (3 dots) click handlers for editing
            const taskMenus = panel.querySelectorAll('.task-menu');
            taskMenus.forEach(menu => {
                menu.replaceWith(menu.cloneNode(true));
            });
            const newTaskMenus = panel.querySelectorAll('.task-menu');
            newTaskMenus.forEach(menu => {
                menu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Task menu clicked');
                    const taskId = menu.dataset.taskId;
                    const addTaskForm = panel.querySelector('#addTaskForm');
                    const addTaskBtn = panel.querySelector('#showAddTaskForm');
                    if (!addTaskForm || !addTaskBtn) return;
                    
                    // Get task data
                    const task = this.getLocalTasks().find(t => t.id === taskId);
                    if (!task) return; // Only local tasks can be edited
                    
                    const config = this.getTaskConfig(taskId);
                    const taskItem = menu.closest('.task-item');
                    
                    // Enter edit mode
                    this.editingTaskId = taskId;
                    
                    // Hide the task item being edited
                    if (taskItem) {
                        taskItem.style.display = 'none';
                        // Move form right after the hidden task item
                        taskItem.parentNode.insertBefore(addTaskForm, taskItem.nextSibling);
                    }
                    
                    addTaskForm.style.display = 'block';
                    addTaskBtn.disabled = true;
                    
                    // Fill form with task data
                    const taskInput = addTaskForm.querySelector('#taskDescription');
                    const pomodorosInput = addTaskForm.querySelector('#pomodorosCount');
                    const deleteBtn = addTaskForm.querySelector('#deleteTask');
                    const cancelBtn = addTaskForm.querySelector('#cancelAddTask');
                    
                    if (taskInput) taskInput.value = task.content || '';
                    if (pomodorosInput) pomodorosInput.value = String(config.sessions || 1);
                    if (deleteBtn) deleteBtn.style.display = '';
                    if (cancelBtn) cancelBtn.style.display = '';
                    if (taskInput) taskInput.focus();
                    
                    // Scroll form into view
                    try { 
                        addTaskForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); 
                    } catch (_) {}
                });
            });
        };
        
        // Setup add task button
        const addTaskBtn = panel.querySelector('#showAddTaskForm');
        const addTaskForm = panel.querySelector('#addTaskForm');
        if (addTaskBtn && addTaskForm) {
            addTaskBtn.replaceWith(addTaskBtn.cloneNode(true));
            const newAddTaskBtn = panel.querySelector('#showAddTaskForm');
            newAddTaskBtn.addEventListener('click', () => {
                console.log('Add Task button clicked');
                
                // Track Add Task button click in Tasks panel
                this.trackEvent('Add Task Button Clicked', {
                    button_type: 'add_task',
                    source: 'tasks_panel',
                    user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                    task_count: this.getLocalTasks().length,
                    conversion_funnel: 'task_creation'
                });
                
                // Check task limit BEFORE showing the form
                const currentTasks = this.getLocalTasks();
                
                // Define limits based on user type
                let taskLimit;
                if (!this.isAuthenticated) {
                    // Guest users: 1 task
                    taskLimit = 1;
                } else if (this.isAuthenticated && !this.isPro) {
                    // Free users: 5 tasks
                    taskLimit = 5;
                } else {
                    // Pro users: unlimited
                    taskLimit = Infinity;
                }
                
                if (currentTasks.length >= taskLimit) {
                    this.showTaskLimitModal();
                    return;
                }
                
                this.editingTaskId = null;
                addTaskForm.style.display = 'block';
                newAddTaskBtn.disabled = true;
                const taskInput = addTaskForm.querySelector('#taskDescription');
                const pomodorosInput = addTaskForm.querySelector('#pomodorosCount');
                const deleteBtn = addTaskForm.querySelector('#deleteTask');
                const cancelBtn = addTaskForm.querySelector('#cancelAddTask');
                const saveBtn = addTaskForm.querySelector('#saveTask');
                if (taskInput) taskInput.value = '';
                if (pomodorosInput) pomodorosInput.value = '1';
                if (deleteBtn) deleteBtn.style.display = 'none';
                const count = (this.getAllTasks() || []).length;
                if (cancelBtn) cancelBtn.style.display = count === 0 ? 'none' : '';
                if (saveBtn) saveBtn.disabled = !taskInput || !taskInput.value.trim();
                if (taskInput) taskInput.focus();
            });
        }
        
        // Initial UI state
        if (addTaskBtn && addTaskForm) {
            const initialTasks = this.getAllTasks();
            if (Array.isArray(initialTasks) && initialTasks.length === 0) {
                addTaskForm.style.display = 'block';
                addTaskBtn.disabled = true;
                const cancelBtn0 = addTaskForm.querySelector('#cancelAddTask');
                const saveBtn0 = addTaskForm.querySelector('#saveTask');
                const taskInput0 = addTaskForm.querySelector('#taskDescription');
                if (cancelBtn0) cancelBtn0.style.display = 'none';
                if (saveBtn0) saveBtn0.disabled = true;
                if (taskInput0) taskInput0.focus();
            } else {
                addTaskForm.style.display = 'none';
                addTaskBtn.disabled = false;
            }
        }
        
        // Setup tabs FIRST - remove all old listeners
        const tabs = panel.querySelectorAll('.task-tab');
        console.log('🔵 Found tabs:', tabs.length);
        tabs.forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });
        
        // Add new listeners to fresh tabs
        const newTabs = panel.querySelectorAll('.task-tab');
        console.log('🔵 Setting up listeners for', newTabs.length, 'tabs');
        newTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Tab clicked:', tab.dataset.tab);
                
                // Update active states
                newTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                
                const addTaskForm = panel.querySelector('#addTaskForm');
                const addTaskBtn = panel.querySelector('#showAddTaskForm');
                const addTaskSection = panel.querySelector('.add-task-section');
                
                if (currentTab === 'done') {
                    // Hide add task elements in Done tab
                    if (addTaskForm) addTaskForm.style.display = 'none';
                    if (addTaskSection) addTaskSection.style.display = 'none';
                } else {
                    // Show add task elements in To-do tab
                    if (addTaskSection) addTaskSection.style.display = 'block';
                    if (addTaskForm && addTaskBtn) {
                        const tasks = this.getAllTasks();
                        if (Array.isArray(tasks) && tasks.length === 0) {
                            addTaskForm.style.display = 'block';
                            addTaskBtn.disabled = true;
                        } else {
                            addTaskForm.style.display = 'none';
                            addTaskBtn.disabled = false;
                        }
                    }
                }
                
                // Re-render tasks for the selected tab
                renderTasks();
            });
        });
        
        // Setup form controls for the panel
        this.setupAddTaskFormControlsForPanel(panel, renderTasks);
        
        // Setup task options dropdown
        const taskOptionsBtn = panel.querySelector('#taskOptionsBtn');
        const taskOptionsDropdown = panel.querySelector('#taskOptionsDropdown');
        const clearAllBtn = panel.querySelector('#clearAllTasksBtn');
        const clearDoneBtn = panel.querySelector('#clearDoneTasksBtn');
        
        if (taskOptionsBtn && taskOptionsDropdown) {
            taskOptionsBtn.replaceWith(taskOptionsBtn.cloneNode(true));
            const newTaskOptionsBtn = panel.querySelector('#taskOptionsBtn');
            newTaskOptionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Options button clicked');
                const isVisible = taskOptionsDropdown.style.display === 'block';
                taskOptionsDropdown.style.display = isVisible ? 'none' : 'block';
            });
            
            // Close dropdown when clicking outside
            setTimeout(() => {
                const closeDropdown = (e) => {
                    if (!newTaskOptionsBtn.contains(e.target) && !taskOptionsDropdown.contains(e.target)) {
                        taskOptionsDropdown.style.display = 'none';
                    }
                };
                document.addEventListener('click', closeDropdown);
                
                // Store reference to remove later if needed
                if (!panel.dataset.hasOptionsListener) {
                    panel.dataset.hasOptionsListener = 'true';
                }
            }, 100);
        }
        
        if (clearAllBtn) {
            clearAllBtn.replaceWith(clearAllBtn.cloneNode(true));
            const newClearAllBtn = panel.querySelector('#clearAllTasksBtn');
            newClearAllBtn.addEventListener('click', () => {
                this.clearAllTasks();
                renderTasks();
                if (taskOptionsDropdown) taskOptionsDropdown.style.display = 'none';
            });
        }
        
        if (clearDoneBtn) {
            clearDoneBtn.replaceWith(clearDoneBtn.cloneNode(true));
            const newClearDoneBtn = panel.querySelector('#clearDoneTasksBtn');
            newClearDoneBtn.addEventListener('click', () => {
                this.clearCompletedTasks();
                renderTasks();
                if (taskOptionsDropdown) taskOptionsDropdown.style.display = 'none';
            });
        }
        
        // Setup integration buttons
        const todoistBtn = panel.querySelector('#importTodoistMainBtn');
        console.log('🔵 Todoist button found:', todoistBtn);
        console.log('🔵 Panel element:', panel);
        console.log('🔵 All buttons in panel:', panel.querySelectorAll('button'));
        
        if (todoistBtn) {
            // Remove any existing listeners by cloning the button
            const newTodoistBtn = todoistBtn.cloneNode(true);
            todoistBtn.parentNode.replaceChild(newTodoistBtn, todoistBtn);
            
            console.log('🔵 New Todoist button created:', newTodoistBtn);
            console.log('🔵 Adding click listener to Todoist button');
            
            newTodoistBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔵 Todoist button clicked - checking user type and connection status');
                
                // Track Todoist button click
                this.trackEvent('Todoist Integration Clicked', {
                    button_type: 'todoist_integration',
                    source: 'tasks_panel',
                    user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                    conversion_funnel: 'integration_interest'
                });
                
                // Check if user is Pro (double check with isPremiumUser)
                const isProUser = this.isAuthenticated && this.user && (this.isPro || this.isPremiumUser());
                
                if (isProUser) {
                    // Pro users can access integrations
                    try {
                        // Check if Todoist is connected first
                        const isConnected = await this.checkTodoistConnection();
                        console.log('🔍 Todoist connection status:', isConnected);
                        
                        if (!isConnected) {
                            // Pro user not connected → redirect to auth
                            console.log('🔗 Pro user not connected - redirecting to Todoist auth...');
                            const userId = window.Clerk?.user?.id || '';
                            const viewMode = localStorage.getItem('viewMode');
                            
                            console.log('🔗 Connecting Todoist:', { 
                                userId, 
                                viewMode,
                                clerkUser: window.Clerk?.user 
                            });
                            
                            const devModeParam = viewMode === 'pro' ? '&devMode=pro&bypass=true' : '';
                            window.location.href = `/api/todoist-auth-start?uid=${encodeURIComponent(userId)}${devModeParam}`;
                        } else {
                            // Pro user connected → show tasks modal for import
                            console.log('📋 Pro user connected - showing Todoist projects modal...');
                            await this.showTodoistProjectsModal();
                        }
                    } catch (error) {
                        console.error('Error checking Todoist connection:', error);
                        // Fallback to auth redirect
                        const userId = window.Clerk?.user?.id || '';
                        const viewMode = localStorage.getItem('viewMode');
                        const devModeParam = viewMode === 'pro' ? '&devMode=pro&bypass=true' : '';
                        window.location.href = `/api/todoist-auth-start?uid=${encodeURIComponent(userId)}${devModeParam}`;
                    }
                } else {
                    // Guest and Free users show integration modal
                    console.log('💰 Showing integration modal for non-Pro user');
                    this.showIntegrationModal('todoist');
                }
            });
            
            console.log('🔵 Event listener added successfully');
        } else {
            console.warn('⚠️ Todoist button not found in panel');
        }
        
        const notionBtn = panel.querySelector('#importNotionMainBtn');
        if (notionBtn) {
            notionBtn.replaceWith(notionBtn.cloneNode(true));
            const newNotionBtn = panel.querySelector('#importNotionMainBtn');
            newNotionBtn.addEventListener('click', () => {
                console.log('Notion button clicked');
                
                // Track Notion button click
                this.trackEvent('Notion Integration Clicked', {
                    button_type: 'notion_integration',
                    source: 'tasks_panel',
                    user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                    conversion_funnel: 'integration_interest'
                });
                
                this.showNotionIntegration();
            });
        }
        
        
        // Initial render
        console.log('🔵 Calling initial renderTasks');
        renderTasks();
        console.log('✅ renderTasksInSidePanel completed successfully');
    }


    async playPreview(type, button) {
        console.log(`🎵 Playing ${type} preview`);
        
        // Stop any existing preview
        if (this.previewAudio) {
            this.previewAudio.pause();
            this.previewAudio.currentTime = 0;
        }
        
        // Remove playing class from all preview buttons
        document.querySelectorAll('.preview-sound-btn').forEach(btn => {
            btn.classList.remove('playing');
        });
        
        // Clear any existing preview timeout
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }
        
        // Set the source based on type
        let source = '';
        if (type === 'lofi' && this.lofiShuffledPlaylist.length > 0) {
            source = '/audio/Lofi/' + this.lofiShuffledPlaylist[0];
        }
        
        if (!source) {
            console.error('No preview source available');
            return;
        }
        
        // Add playing class to button
        button.classList.add('playing');
        
        // Set source and volume
        this.previewAudio.src = source;
        this.previewAudio.volume = this.ambientVolume;
        
        try {
            // Play the preview
            await this.previewAudio.play();
            console.log(`✅ Preview playing for 5 seconds`);
            
            // Stop after 5 seconds
            this.previewTimeout = setTimeout(() => {
                if (this.previewAudio) {
                    this.previewAudio.pause();
                    this.previewAudio.currentTime = 0;
                }
                button.classList.remove('playing');
                console.log('⏹️ Preview stopped');
            }, 5000);
            
        } catch (error) {
            console.error('Error playing preview:', error);
            button.classList.remove('playing');
        }
    }

    initializeSettingsSidePanel() {
        console.log('⚙️ Initializing settings side panel');
        
        // Sync panel with current technique when opening
        const currentTechnique = localStorage.getItem('selectedTechnique');
        if (currentTechnique && currentTechnique !== 'custom') {
            this.syncSettingsPanelTechnique(currentTechnique);
        } else {
            // Custom configuration - deselect all techniques
            this.deselectTechniqueInPanel();
        }
        
        const settingsPanel = document.getElementById('settingsSidePanel');
        if (!settingsPanel) {
            console.error('❌ Settings panel not found');
            return;
        }

        // Get current durations
        const pomodoroMin = Math.floor(this.workTime / 60);
        const shortBreakMin = Math.floor(this.shortBreakTime / 60);
        const longBreakMin = Math.floor(this.longBreakTime / 60);

        // Set initial slider values
        const pomodoroSlider = settingsPanel.querySelector('#sidebarPomodoroSlider');
        const shortBreakSlider = settingsPanel.querySelector('#sidebarShortBreakSlider');
        const longBreakSlider = settingsPanel.querySelector('#sidebarLongBreakSlider');
        const pomodoroValue = settingsPanel.querySelector('#sidebarPomodoroValue');
        const shortBreakValue = settingsPanel.querySelector('#sidebarShortBreakValue');
        const longBreakValue = settingsPanel.querySelector('#sidebarLongBreakValue');

        // Disable duration controls for guest users
        if (!this.isAuthenticated) {
            console.log('🔒 Disabling duration controls for guest user');
            
            // Disable Focus duration
            const focusOption = document.getElementById('sidebarFocusOption');
            if (focusOption) {
                focusOption.style.opacity = '0.5';
                focusOption.style.cursor = 'not-allowed';
                const focusLabel = focusOption.querySelector('label');
                if (focusLabel) {
                    focusLabel.innerHTML = 'Work <span style="font-size: 0.75rem; color: #888;">(Sign up required)</span>';
                }
            }
            if (pomodoroSlider) {
                pomodoroSlider.disabled = true;
                pomodoroSlider.style.cursor = 'not-allowed';
            }
            
            // Disable Short Break duration
            const shortBreakOption = document.getElementById('sidebarShortBreakOption');
            if (shortBreakOption) {
                shortBreakOption.style.opacity = '0.5';
                shortBreakOption.style.cursor = 'not-allowed';
                const shortBreakLabel = shortBreakOption.querySelector('label');
                if (shortBreakLabel) {
                    shortBreakLabel.innerHTML = 'Short Break <span style="font-size: 0.75rem; color: #888;">(Sign up required)</span>';
                }
            }
            if (shortBreakSlider) {
                shortBreakSlider.disabled = true;
                shortBreakSlider.style.cursor = 'not-allowed';
            }
            
            // Disable Long Break duration
            const longBreakOption = document.getElementById('sidebarLongBreakOption');
            if (longBreakOption) {
                longBreakOption.style.opacity = '0.5';
                longBreakOption.style.cursor = 'not-allowed';
                const longBreakLabel = longBreakOption.querySelector('label');
                if (longBreakLabel) {
                    longBreakLabel.innerHTML = 'Long Break <span style="font-size: 0.75rem; color: #888;">(Sign up required)</span>';
                }
            }
            if (longBreakSlider) {
                longBreakSlider.disabled = true;
                longBreakSlider.style.cursor = 'not-allowed';
            }
        }

        if (pomodoroSlider && pomodoroValue) {
            pomodoroSlider.value = pomodoroMin;
            pomodoroValue.textContent = `${pomodoroMin} min`;
            
            pomodoroSlider.addEventListener('input', (e) => {
                pomodoroValue.textContent = `${e.target.value} min`;
                this.enableSaveButton();
                // Deselect technique when manually changing duration
                this.deselectTechniqueInPanel();
            });
        }

        if (shortBreakSlider && shortBreakValue) {
            shortBreakSlider.value = shortBreakMin;
            shortBreakValue.textContent = `${shortBreakMin} min`;
            
            shortBreakSlider.addEventListener('input', (e) => {
                shortBreakValue.textContent = `${e.target.value} min`;
                this.enableSaveButton();
                // Deselect technique when manually changing duration
                this.deselectTechniqueInPanel();
            });
        }

        if (longBreakSlider && longBreakValue) {
            longBreakSlider.value = longBreakMin;
            longBreakValue.textContent = `${longBreakMin} min`;
            
            const longBreakCard = longBreakSlider.closest('.duration-item');
            
            // Disable Long Break card for guest users
            if (!this.isAuthenticated && longBreakCard) {
                longBreakCard.style.opacity = '0.5';
                longBreakCard.style.pointerEvents = 'none';
                longBreakCard.style.cursor = 'not-allowed';
                
                // Show "(Sign up required)" in the label
                const signupText = longBreakCard.querySelector('.signup-required-text');
                if (signupText) {
                    signupText.classList.remove('hidden');
                }
            }
            
            longBreakSlider.addEventListener('input', (e) => {
                if (!this.isAuthenticated) {
                    this.showLoginRequiredModal('longbreak');
                    return;
                }
                longBreakValue.textContent = `${e.target.value} min`;
                this.enableSaveButton();
                // Deselect technique when manually changing duration
                this.deselectTechniqueInPanel();
            });
        }

        // Sessions slider
        const sessionsSlider = settingsPanel.querySelector('#sidebarSessionsSlider');
        const sessionsValue = settingsPanel.querySelector('#sidebarSessionsValue');
        const sessionsCard = sessionsSlider?.closest('.duration-item');
        
        if (sessionsSlider && sessionsValue && sessionsCard) {
            sessionsSlider.value = this.sessionsPerCycle;
            sessionsValue.textContent = `${this.sessionsPerCycle} sesh`;
            
            // Disable entire sessions card for guest users
            if (!this.isAuthenticated) {
                sessionsCard.style.opacity = '0.5';
                sessionsCard.style.pointerEvents = 'none';
                sessionsCard.style.cursor = 'not-allowed';
                
                // Show "(Sign up required)" in the label
                const signupText = sessionsCard.querySelector('.signup-required-text');
                if (signupText) {
                    signupText.classList.remove('hidden');
                }
            }
            
            sessionsSlider.addEventListener('input', (e) => {
                if (!this.isAuthenticated) {
                    this.showLoginRequiredModal('sessions');
                    return;
                }
                sessionsValue.textContent = `${e.target.value} sesh`;
                this.enableSaveButton();
                // Deselect technique when manually changing duration
                this.deselectTechniqueInPanel();
            });
        }

        // Techniques presets
        const techniquePresets = settingsPanel.querySelectorAll('.technique-preset');
        techniquePresets.forEach(preset => {
            const technique = preset.dataset.technique;
            
            // Keep techniques enabled for guest users but show modal on click
            if (technique !== 'pomodoro' && !this.isAuthenticated) {
                // Show "(Sign up required)" text so user knows it requires signup
                const signupText = preset.querySelector('.signup-required-text');
                if (signupText) {
                    signupText.classList.remove('hidden');
                }
            }
            
            // For guest users, ensure Pomodoro has active class
            if (technique === 'pomodoro' && !this.isAuthenticated) {
                preset.classList.add('active');
                console.log('✅ Pomodoro marked as active for guest user');
            }
            
            preset.addEventListener('click', () => {
                // Check if technique requires authentication (all except pomodoro)
                if (technique !== 'pomodoro' && !this.isAuthenticated) {
                    // Show technique modal for guest users
                    this.showTechniqueModal(technique);
                    return;
                }
                
                this.trackEvent('Technique Selected', {
                    button_type: 'technique_preset',
                    technique_name: technique,
                    source: 'timer_sidebar',
                    user_type: this.isAuthenticated ? (this.isPro ? 'pro' : 'free') : 'guest',
                    conversion_funnel: 'technique_exploration'
                });
                // Remove active class from all presets
                techniquePresets.forEach(p => p.classList.remove('active'));
                // Add active class to clicked preset
                preset.classList.add('active');
                
                // Apply technique settings
                this.applySidebarTechniquePreset(technique, pomodoroSlider, shortBreakSlider, longBreakSlider, sessionsSlider);
                
                // Enable save button when technique changes
                this.enableSaveButton();
            });
        });

        // Save button handler
        const saveBtn = settingsPanel.querySelector('#sidebarSaveSettings');
        if (saveBtn) {
            // Initialize save button as disabled (will be enabled when changes are made)
            saveBtn.disabled = true;
            
            if (!this.isAuthenticated) {
                console.log('🔒 Save button disabled for guest user');
            } else {
                saveBtn.addEventListener('click', () => {
                    // Save new durations
                    this.workTime = parseInt(pomodoroSlider.value) * 60;
                    this.shortBreakTime = parseInt(shortBreakSlider.value) * 60;
                    this.longBreakTime = parseInt(longBreakSlider.value) * 60;
                    this.sessionsPerCycle = parseInt(sessionsSlider.value);
                    
                    // Save to localStorage ONLY if user is authenticated
                    if (this.isAuthenticated) {
                        localStorage.setItem('pomodoroTime', String(this.workTime));
                        localStorage.setItem('shortBreakTime', String(this.shortBreakTime));
                        localStorage.setItem('longBreakTime', String(this.longBreakTime));
                        localStorage.setItem('sessionsPerCycle', String(this.sessionsPerCycle));
                        
                        // Save the currently selected technique (or mark as custom if none selected)
                        const activeTechnique = document.querySelector('.technique-preset.active');
                        if (activeTechnique && activeTechnique.dataset.technique) {
                            localStorage.setItem('selectedTechnique', activeTechnique.dataset.technique);
                            console.log(`✅ Technique '${activeTechnique.dataset.technique}' saved to localStorage`);
                        } else {
                            // No technique selected = custom configuration
                            localStorage.setItem('selectedTechnique', 'custom');
                            console.log('✅ Custom configuration saved (no technique selected)');
                        }
                        
                        console.log('✅ Settings saved to localStorage (authenticated user)');
                    } else {
                        console.log('ℹ️ Settings applied for this session only (guest user)');
                    }
                    
                    // Update cycle sections
                    this.cycleSections = [
                        { type: 'work', duration: this.workTime, name: 'Work 1' },
                        { type: 'break', duration: this.shortBreakTime, name: 'Break 1' },
                        { type: 'work', duration: this.workTime, name: 'Work 2' },
                        { type: 'break', duration: this.shortBreakTime, name: 'Break 2' },
                        { type: 'work', duration: this.workTime, name: 'Work 3' },
                        { type: 'break', duration: this.shortBreakTime, name: 'Break 3' },
                        { type: 'work', duration: this.workTime, name: 'Work 4' },
                        { type: 'long-break', duration: this.longBreakTime, name: 'Long Break' }
                    ];
                    
                    // Reset timer to first section using the complete reset function
                    this.resetTimer();
                    
                    // Close the settings panel
                    const sidebarManager = document.querySelector('.sidebar');
                    if (window.sidebarManager) {
                        window.sidebarManager.closeSettingsPanel();
                    }
                    
                    console.log('✅ Settings applied successfully');
                    
                    // Reset save button state after successful save
                    this.resetSaveButton();
                });
            }
        }
        
    }


    applyBackground(backgroundName) {
        // Don't apply background if immersive theme is active
        if (this.currentImmersiveTheme && this.currentImmersiveTheme !== 'none') {
            console.log(`🎨 Background change blocked - immersive theme '${this.currentImmersiveTheme}' is active`);
            return;
        }
        
        const timerSection = document.querySelector('.timer-section');
        if (!timerSection) {
            console.error('❌ Timer section not found');
            return;
        }
        
        // Remove all background classes
        timerSection.classList.remove('theme-minimalist', 'theme-woman', 'theme-man');
        
        // Add new background class
        timerSection.classList.add(`theme-${backgroundName}`);
        
        // Winter visit button removed - no longer needed
        
        // Save preference to localStorage
        localStorage.setItem('selectedBackground', backgroundName);
        this.currentBackground = backgroundName;
        
        // 🎯 Track Background Changed event to Mixpanel
        if (window.mixpanelTracker) {
            window.mixpanelTracker.trackCustomEvent('Background Changed', { background_name: backgroundName });
            console.log('📊 Background changed event tracked to Mixpanel');
        }
        
        console.log(`🎨 Background changed to: ${backgroundName}`);
    }

    // Immersive Theme Functions
    async loadTronAssets() {
        try {
            console.log('🎨 Loading Tron assets...');
            
            // Load single Tron image
            this.tronImage = '/themes/Tron/1395234.jpg';
            
            
            console.log('🎨 Tron assets loaded successfully');
            console.log('🎨 Image:', this.tronImage);
        } catch (error) {
            console.error('❌ Failed to load Tron assets:', error);
        }
    }

    initializeImmersiveThemePanel() {
        console.log('🎨 Initializing theme panel');
        
        // Get current theme from localStorage or default to 'lofi'
        // Load last selected theme for both authenticated and guest users
        const lastSelectedTheme = localStorage.getItem('lastSelectedTheme');
        const savedTheme = lastSelectedTheme || 'lofi';
        
        this.currentTheme = savedTheme;
        
        // Initialize volume control
        this.initializeVolumeControl();
        
        // Get all theme options
        const themeOptions = document.querySelectorAll('.theme-option[data-theme]');
        
        themeOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            const themeName = option.dataset.theme;
            
            // Set initial active state
            if (themeName === savedTheme) {
                option.classList.add('active');
                if (radio) radio.checked = true;
            }
            
            // Set up click handler
            option.addEventListener('click', (e) => {
                e.preventDefault();
                
                this.trackEvent('Cassette Selected', {
                    button_type: 'cassette',
                    cassette_name: themeName,
                    source: 'cassettes_panel'
                });
                
                // Check if theme requires authentication
                const requiresAuth = option.dataset.requiresAuth === 'true';
                if (requiresAuth && !this.isAuthenticated) {
                    // Show modal with theme info
                    this.showTronInfoModal();
                    return;
                }
                
                // Remove active from all options
                themeOptions.forEach(opt => {
                    opt.classList.remove('active');
                    const optRadio = opt.querySelector('input[type="radio"]');
                    if (optRadio) optRadio.checked = false;
                });
                
                // Add active to clicked option
                option.classList.add('active');
                if (radio) radio.checked = true;
                
                // Apply the selected theme
                this.applyTheme(themeName);
                
                // Save to localStorage (for both authenticated and guest users)
                localStorage.setItem('lastSelectedTheme', themeName);
                this.currentTheme = themeName;
            });
        });
        
        // Don't reapply theme when opening sidebar - just update visual state
        this.updateThemeActiveState(savedTheme);
        
        // Update theme authentication state
        this.updateThemeAuthState();
        
        console.log('🎨 Theme panel initialized - no music reset');
    }
    
    initializeVolumeControl() {
        const volumeSlider = document.getElementById('sidebarAmbientVolume');
        const volumeValue = document.getElementById('sidebarVolumeValue');
        
        if (volumeSlider && volumeValue) {
            // Set initial volume
            volumeSlider.value = this.lofiVolume * 100;
            volumeValue.textContent = Math.round(this.lofiVolume * 100) + '%';
            
            // Add event listener
            volumeSlider.addEventListener('input', (e) => {
                const newVolume = e.target.value / 100;
                this.lofiVolume = newVolume;
                volumeValue.textContent = e.target.value + '%';
                
                // Update audio volume if playing
                const audio = document.getElementById('backgroundAudio');
                if (audio) {
                    audio.volume = newVolume;
                }
                
                // Save to localStorage
                localStorage.setItem('lofiVolume', newVolume.toString());
            });
        }
    }

    applyTheme(themeName) {
        console.log(`🎨 Applying theme: ${themeName}`);
        
        // Pause timer when changing cassettes for better UX
        if (this.isRunning) {
            this.pauseTimer();
            console.log('🎨 Timer paused due to cassette change');
        }
        
        const timerSection = document.querySelector('.timer-section');
        if (!timerSection) {
            console.error('❌ Timer section not found');
            return;
        }
        
        // Remove all background classes
        timerSection.classList.remove('theme-minimalist', 'theme-woman', 'theme-man');
        
        if (themeName === 'simple') {
            // Simple theme: black background, no music
            // Stop Tron music first if active
            if (this.currentImmersiveTheme === 'tron') {
                this.deactivateImmersiveTheme();
            }
            
            timerSection.classList.add('theme-minimalist');
            this.stopLofiPlaylist();
            this.lofiEnabled = false;
            if (this.isAuthenticated) {
                localStorage.setItem('lofiEnabled', 'false');
            }
            
            // Always stop music for Simple theme (whether timer is running or not)
            console.log('🎨 Simple theme applied - black background, no music');
            
        } else if (themeName === 'lofi') {
            // Lofi theme: Garden Study background + lofi music
            // Stop Tron music first if active
            if (this.currentImmersiveTheme === 'tron') {
                this.deactivateImmersiveTheme();
            }
            
            timerSection.classList.add('theme-woman');
            this.lofiEnabled = true;
            if (this.isAuthenticated) {
                localStorage.setItem('lofiEnabled', 'true');
            }
            
            // If timer is running, start music immediately
            if (this.isRunning) {
                this.playLofiPlaylist().catch(err => console.log('Lofi start error:', err));
                console.log('🎨 Lofi theme applied - Garden Study background + lofi music (music started because timer is running)');
            } else {
                console.log('🎨 Lofi theme applied - Garden Study background + lofi music (music will start when timer starts)');
            }
            
        } else if (themeName === 'tron') {
            // Tron theme: slideshow + tron music
            // Stop Lofi music first
            this.stopLofiPlaylist();
            this.lofiEnabled = false;
            if (this.isAuthenticated) {
                localStorage.setItem('lofiEnabled', 'false');
            }
            
            // Only deactivate if not already Tron theme
            if (this.currentImmersiveTheme !== 'tron') {
            this.deactivateImmersiveTheme();
            }
            
            this.applyImmersiveTheme('tron');
            
            // Check if user is authenticated for Tron theme
            if (!this.isAuthenticated) {
                console.log('🎨 Tron theme requires authentication');
                alert('Tron theme requires an account. Sign up for free to unlock all immersive themes!');
                // Revert to default theme
                this.applyTheme('lofi');
                return;
            }
            
            // Create Spotify widget for Tron theme (only if not already created)
            if (!this.tronSpotifyWidget) {
                this.createTronSpotifyWidget();
                // Show loading and disable Start button while widget is connecting
                this.showSpotifyLoading();
                this.disableStartButtonForSpotify();
            } else if (this.tronSpotifyWidgetReady) {
                // Widget already exists and is ready, enable Start button immediately
                this.enableStartButtonForSpotify();
                console.log('🎨 Tron theme applied - Spotify widget already ready');
            }
            
            // If timer is running, start Spotify immediately (disabled to avoid playlist restart issues)
            // if (this.isRunning) {
            //     this.startTronSpotify();
            //     console.log('🎨 Tron theme applied - background + Spotify (timer is running)');
            // } else {
            //     console.log('🎨 Tron theme applied - background + Spotify (will start when timer starts)');
            // }
        }
        
        // Save theme preference (for both authenticated and guest users)
        localStorage.setItem('lastSelectedTheme', themeName);
        this.currentTheme = themeName;
        
        // Update visual active state
        this.updateThemeActiveState(themeName);
        
        // Track theme change
        if (window.mixpanelTracker) {
            window.mixpanelTracker.trackCustomEvent('Theme Changed', { theme_name: themeName });
            console.log('📊 Theme changed event tracked to Mixpanel');
        }
    }
    
    updateThemeActiveState(themeName) {
        // Get all theme options
        const themeOptions = document.querySelectorAll('.theme-option[data-theme]');
        
        themeOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            const optionThemeName = option.dataset.theme;
            
            // Remove active from all options
            option.classList.remove('active');
            if (radio) radio.checked = false;
            
            // Add active to the selected theme
            if (optionThemeName === themeName) {
                option.classList.add('active');
                if (radio) radio.checked = true;
            }
        });
        
        console.log(`🎨 Theme active state updated to: ${themeName}`);
    }

    applyImmersiveTheme(themeName) {
        console.log(`🎨 Applying immersive theme: ${themeName}`);
        
        if (themeName === 'tron') {
            this.activateTronTheme();
        } else {
            console.log(`🎨 Unknown immersive theme: ${themeName}`);
        }
    }

    activateTronTheme() {
        console.log('🎨 Activating Tron theme...');
        console.log('🎨 Tron image available:', this.tronImage);
        
        const timerSection = document.querySelector('.timer-section');
        if (!timerSection) {
            console.error('❌ Timer section not found');
            return;
        }
        
        if (!this.tronImage) {
            console.error('❌ Tron image not loaded, loading assets first...');
            this.loadTronAssets();
        }
        
        console.log('🎨 Timer section found, setting Tron background...');
        
        // Remove ALL background classes and set Tron background
        timerSection.classList.remove('theme-minimalist', 'theme-woman', 'theme-man');
        
        // Force Tron background with !important to override CSS
        timerSection.style.setProperty('background-image', `url('${this.tronImage}')`, 'important');
        timerSection.style.setProperty('background-size', 'cover', 'important');
        timerSection.style.setProperty('background-position', 'center', 'important');
        timerSection.style.setProperty('background-repeat', 'no-repeat', 'important');
        timerSection.style.setProperty('background-color', 'transparent', 'important');
        
        console.log('🎨 Tron background set:', this.tronImage);
        console.log('🎨 Applied styles:', {
            backgroundImage: timerSection.style.backgroundImage,
            backgroundSize: timerSection.style.backgroundSize,
            backgroundPosition: timerSection.style.backgroundPosition
        });
        
        // Clear Music and Background selections when Tron is active
        this.clearMusicAndBackgroundSelections();
        
        // Switch to Tron music (will start when timer starts)
        // Ensure lofi is not playing anymore
        this.stopLofiPlaylist();
        
        // Save preference only if user is authenticated
        if (this.isAuthenticated) {
            localStorage.setItem('selectedImmersiveTheme', 'tron');
        }
        this.currentImmersiveTheme = 'tron';
        
        console.log('🎨 Tron theme activated successfully');
    }

    clearMusicAndBackgroundSelections() {
        // Clear Music panel selections
        const musicOptions = document.querySelectorAll('.music-option');
        musicOptions.forEach(option => {
            option.classList.remove('active');
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });
        
        // Clear Background panel selections
        const backgroundOptions = document.querySelectorAll('.theme-option[data-background]');
        backgroundOptions.forEach(option => {
            option.classList.remove('active');
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });
        
        console.log('🎨 Cleared Music and Background selections for Tron theme');
    }

    deactivateImmersiveTheme() {
        const timerSection = document.querySelector('.timer-section');
        if (!timerSection) return;
        
        // Remove Tron background
        timerSection.style.removeProperty('background-image');
        timerSection.style.removeProperty('background-size');
        timerSection.style.removeProperty('background-position');
        timerSection.style.removeProperty('background-repeat');
        timerSection.style.removeProperty('background-color');
        
        // Tron theme deactivated - remove Spotify widget
        if (this.currentImmersiveTheme === 'tron') {
            this.removeTronSpotifyWidget();
            this.tronSpotifyWidgetReady = false;
            this.tronSpotifyWidgetActivated = false;
            console.log('🎨 Tron theme deactivated - background + Spotify widget removed');
        }
        
        // Save preference only if user is authenticated
        if (this.isAuthenticated) {
            localStorage.setItem('selectedImmersiveTheme', 'none');
        }
        this.currentImmersiveTheme = 'none';
        
        // Don't close the panel automatically - let user control it
        
        console.log('🎨 Immersive theme deactivated');
        
        // Restore the current theme background
        setTimeout(() => {
            this.applyTheme(this.currentTheme);
        }, 100);
    }


    



    applyOverlay(opacity) {
        const timerSection = document.querySelector('.timer-section');
        if (!timerSection) {
            console.error('❌ Timer section not found');
            return;
        }
        
        // Find or create overlay element
        let overlayElement = timerSection.querySelector('.theme-overlay');
        
        if (!overlayElement) {
            // Create overlay element if it doesn't exist
            overlayElement = document.createElement('div');
            overlayElement.className = 'theme-overlay';
            timerSection.insertBefore(overlayElement, timerSection.firstChild);
        }
        
        // Apply opacity directly to the overlay
        overlayElement.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
        
        console.log(`🎨 Overlay opacity set to: ${Math.round(opacity * 100)}%`);
    }

    // Tron Spotify Widget Methods
    createTronSpotifyWidget() {
        console.log('🎵 Creating Tron Spotify widget...');
        
        // Check if widget already exists
        if (this.tronSpotifyWidget) {
            console.log('🎵 Tron Spotify widget already exists, skipping creation');
            return;
        }
        
        // Remove existing widget if any
        const existingWidget = document.getElementById('tron-spotify-widget');
        if (existingWidget) {
            existingWidget.remove();
        }

        // Create Spotify widget iframe
        const widget = document.createElement('iframe');
        widget.id = 'tron-spotify-widget';
        widget.src = this.tronSpotifyEmbedUrl;
        widget.width = '300';
        widget.height = '152';
        widget.frameBorder = '0';
        widget.allowTransparency = 'true';
        widget.setAttribute('title', 'Spotify Music Player');
        widget.setAttribute('aria-label', 'Spotify Music Player for Tron theme');
        widget.allow = 'encrypted-media';
        widget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 152px;
            z-index: 1000;
            border-radius: 8px;
            border: none;
            pointer-events: auto;
        `;

        document.body.appendChild(widget);
        this.tronSpotifyWidget = widget;
        
        // Create background image button
        this.createTronImageButton();
        
        // Widget is now visible and ready
        this.tronSpotifyWidgetReady = true;
        this.tronSpotifyWidgetActivated = true;
        console.log('🎵 Spotify widget created and visible');
        
        console.log('🎵 Tron Spotify widget created');
    }

    startTronSpotify() {
        console.log('🎵 Starting Tron Spotify...');
        
        if (this.tronSpotifyWidget) {
            // Only send play command, don't reactivate widget to avoid restarting playlist
            try {
                this.tronSpotifyWidget.contentWindow.postMessage({
                    command: 'play'
                }, '*');
                console.log('🎵 Tron Spotify play command sent');
            } catch (error) {
                console.log('🎵 Tron Spotify control not available (cross-origin)');
            }
        }
    }

    // Widget is now always visible, no complex activation needed



    // No loading needed - widget is visible

    // No loading needed - widget is visible

    createTronImageButton() {
        // Create background image button
        const imageButton = document.createElement('div');
        imageButton.id = 'tron-image-button';
        imageButton.innerHTML = `
            <div class="tron-image-content">
                <div class="tron-image-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-arrow-out-up-right-icon lucide-square-arrow-out-up-right">
                        <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/>
                        <path d="m21 3-9 9"/>
                        <path d="M15 3h6v6"/>
                    </svg>
                </div>
                <div class="tron-image-text">Visit Website</div>
            </div>
        `;
        
        imageButton.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: var(--sidebar-collapsed-width);
            padding: 12px 16px;
            z-index: 1000;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        // Hover effects are now handled by CSS
        
        // Add click handler
        imageButton.addEventListener('click', () => {
            this.trackEvent('Tron Image Button Clicked', {
                button_type: 'tron_image',
                source: 'tron_theme',
                destination: 'wallpaper_site'
            });
            window.open('https://wall.alphacoders.com/big.php?i=1395234', '_blank');
        });
        
        // Add to timer section instead of body
        const timerSection = document.querySelector('.timer-section');
        if (timerSection) {
            timerSection.appendChild(imageButton);
        } else {
            document.body.appendChild(imageButton);
        }
        this.tronImageButton = imageButton;
        console.log('Tron image button created');
    }

    // No button disabling needed - widget is visible and ready


    loadLastSelectedTheme() {
        // Load last selected theme from localStorage (works for both authenticated and guest users)
        const lastSelectedTheme = localStorage.getItem('lastSelectedTheme');
        if (lastSelectedTheme && lastSelectedTheme !== 'lofi') {
            // Check if Tron theme requires authentication
            if (lastSelectedTheme === 'tron' && !this.isAuthenticated) {
                console.log('🎨 Tron theme requires authentication, using default lofi');
            return;
        }
        
            // Only restore if it's not the default lofi theme
            console.log('🎨 Restoring last selected theme:', lastSelectedTheme);
            // Apply the theme after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.applyTheme(lastSelectedTheme);
            }, 100);
        } else {
            console.log('🎨 Using default lofi theme for new user');
        }
    }

    showTronInfoModal() {
        const modal = document.getElementById('tronInfoModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeTronInfoModal() {
        const modal = document.getElementById('tronInfoModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    updateThemeAuthState() {
        // Update theme options based on authentication state
        const themeOptions = document.querySelectorAll('.theme-option[data-requires-auth="true"]');
        themeOptions.forEach(option => {
            const signupText = option.querySelector('.signup-required-text');
            
            if (this.isAuthenticated) {
                option.classList.add('authenticated');
                option.style.pointerEvents = 'auto';
                option.style.opacity = '1';
                if (signupText) signupText.style.display = 'none';
            } else {
                option.classList.remove('authenticated');
                option.style.pointerEvents = 'none';
                option.style.opacity = '0.5';
                if (signupText) signupText.style.display = 'inline';
            }
        });
    }


    pauseTronSpotify() {
        console.log('🎵 Pausing Tron Spotify...');
        
        if (this.tronSpotifyWidget) {
            // Try to control the widget (this may not work due to cross-origin restrictions)
            try {
                this.tronSpotifyWidget.contentWindow.postMessage({
                    command: 'pause'
                }, '*');
                console.log('🎵 Tron Spotify pause command sent');
            } catch (error) {
                console.log('🎵 Tron Spotify control not available (cross-origin)');
            }
        }
    }

    removeTronSpotifyWidget() {
        console.log('🎵 Removing Tron Spotify widget...');
        
        if (this.tronSpotifyWidget) {
            this.tronSpotifyWidget.remove();
            this.tronSpotifyWidget = null;
            console.log('🎵 Tron Spotify widget removed');
        }
        
        // Remove image button
        if (this.tronImageButton) {
            this.tronImageButton.remove();
            this.tronImageButton = null;
            console.log('🖼️ Tron image button removed');
        }
    }

    showSpotifyLoading() {
        // Show loading state for Spotify widget
        console.log('🎵 Showing Spotify loading state...');
        // Add any loading UI here if needed
    }

    disableStartButtonForSpotify() {
        // Disable start button while Spotify is loading
        if (this.startPauseBtn) {
            this.startPauseBtn.disabled = true;
            this.startPauseBtn.style.opacity = '0.5';
        }
    }

    enableStartButtonForSpotify() {
        // Enable start button when Spotify is ready
        if (this.startPauseBtn) {
            this.startPauseBtn.disabled = false;
            this.startPauseBtn.style.opacity = '1';
        }
    }



}

// Global functions for modal
function closeTronInfoModal() {
    if (window.pomodoroTimer) {
        window.pomodoroTimer.closeTronInfoModal();
    }
}

function handleSignup() {
    if (window.pomodoroTimer) {
        window.pomodoroTimer.handleSignup();
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const timer = new PomodoroTimer();
    window.pomodoroTimer = timer; // Make it globally accessible
    
    // Initialize Mixpanel tracking
    if (window.mixpanelTracker) {
        window.mixpanelTracker.init();
    }
    
    // Theme is applied inside constructor via applyTheme(this.currentTheme).
    // Avoid re-applying a stale background here to prevent flashes or mismatches.
    timer.applyOverlay(timer.overlayOpacity);
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
        
        // Close sidebar when clicking on a nav item
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }
    
    // Show timer header auth buttons for guest users
    const timerHeaderAuth = document.getElementById('timerHeaderAuth');
    const timerLoginBtn = document.getElementById('timerLoginBtn');
    const timerSignupBtn = document.getElementById('timerSignupBtn');
    
    if (timerHeaderAuth) {
        if (!timer.isAuthenticated) {
            timerHeaderAuth.style.display = 'block';
            
            if (timerLoginBtn) {
                timerLoginBtn.addEventListener('click', () => {
                    window.location.href = 'https://accounts.superfocus.live/sign-in?redirect_url=https%3A%2F%2Fwww.superfocus.live%2F';
                });
            }
            
            if (timerSignupBtn) {
                timerSignupBtn.addEventListener('click', () => {
                    timer.handleSignup();
                });
            }
        } else {
            // Hide buttons when user is authenticated
            timerHeaderAuth.style.display = 'none';
        }
    }
    
    // Only show loader for Lighthouse or explicit query param
    const shouldShowLoader = () => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('loader') === '1' || params.get('lh') === '1') return true;
            const ua = navigator.userAgent || '';
            return /Lighthouse|Chrome-Lighthouse/i.test(ua);
        } catch (_) {
            return false;
        }
    };
    
    if (shouldShowLoader()) {
        timer.showLoadingScreen();
        const tryHide = () => {
            if (!timer.isLoading) return;
            if (!timer.checkIfStillLoading()) {
                timer.hideLoadingScreen();
                return;
            }
            setTimeout(tryHide, 100);
        };
        setTimeout(tryHide, 200);
        setTimeout(() => timer.hideLoadingScreen(), 4000);
    }
});

// Sidebar functionality
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.getElementById('mainContent');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.navItems = document.querySelectorAll('.nav-item');
        this.taskSidePanel = document.getElementById('taskSidePanel');
        this.taskPanelOverlay = document.getElementById('taskPanelOverlay');
        this.settingsSidePanel = document.getElementById('settingsSidePanel');
        this.settingsPanelOverlay = document.getElementById('settingsPanelOverlay');
        this.immersiveThemeSidePanel = document.getElementById('immersiveThemeSidePanel');
        this.immersiveThemePanelOverlay = document.getElementById('immersiveThemePanelOverlay');
        
        this.isCollapsed = true; // Always collapsed by default
        this.isHidden = false;
        this.isMobile = window.innerWidth <= 768;
        this.isTaskPanelOpen = false;
        this.isSettingsPanelOpen = false;
        this.isImmersiveThemePanelOpen = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupResponsive();
        this.setupTaskPanelScrollBehavior();
        // Don't set any nav item as active by default
        
        // Auto-open task panel for guest users - DISABLED
        // Keep task panel closed by default, user can open it manually
        // this.checkAndOpenForGuest();
    }
    
    checkAndOpenForGuest() {
        // Wait for pomodoroTimer to be initialized
        setTimeout(() => {
            if (window.pomodoroTimer) {
                const isGuest = !window.pomodoroTimer.isAuthenticated || !window.pomodoroTimer.user;
                
                if (isGuest) {
                    console.log('🎯 Guest user detected, opening task panel automatically');
                    this.openTaskPanel();
                }
            }
        }, 500); // Small delay to ensure pomodoroTimer is initialized
    }
    
    setupTaskPanelScrollBehavior() {
        // Handle scroll propagation when sidebar has no scrollable content
        if (this.taskSidePanel) {
            const panelContent = this.taskSidePanel.querySelector('.task-side-panel-content');
            if (panelContent) {
                panelContent.addEventListener('wheel', (e) => {
                    const hasScroll = panelContent.scrollHeight > panelContent.clientHeight;
                    
                    if (!hasScroll) {
                        // No scroll available, let it propagate to main page
                        return;
                    }
                    
                    const isAtTop = panelContent.scrollTop === 0;
                    const isAtBottom = panelContent.scrollTop + panelContent.clientHeight >= panelContent.scrollHeight - 1;
                    
                    // Allow propagation only if scrolling beyond boundaries
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                        return; // Let it propagate
                    }
                    
                    // Otherwise, prevent propagation (normal scroll within panel)
                    e.stopPropagation();
                }, { passive: true });
            }
        }
        
        // Same for music panel
        if (this.musicSidePanel) {
            const panelContent = this.musicSidePanel.querySelector('.task-side-panel-content');
            if (panelContent) {
                panelContent.addEventListener('wheel', (e) => {
                    const hasScroll = panelContent.scrollHeight > panelContent.clientHeight;
                    
                    if (!hasScroll) {
                        return;
                    }
                    
                    const isAtTop = panelContent.scrollTop === 0;
                    const isAtBottom = panelContent.scrollTop + panelContent.clientHeight >= panelContent.scrollHeight - 1;
                    
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                        return;
                    }
                    
                    e.stopPropagation();
                }, { passive: true });
            }
        }
        
        // Same for settings panel
        if (this.settingsSidePanel) {
            const panelContent = this.settingsSidePanel.querySelector('.task-side-panel-content');
            if (panelContent) {
                panelContent.addEventListener('wheel', (e) => {
                    const hasScroll = panelContent.scrollHeight > panelContent.clientHeight;
                    
                    if (!hasScroll) {
                        return;
                    }
                    
                    const isAtTop = panelContent.scrollTop === 0;
                    const isAtBottom = panelContent.scrollTop + panelContent.clientHeight >= panelContent.scrollHeight - 1;
                    
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                        return;
                    }
                    
                    e.stopPropagation();
                }, { passive: true });
            }
        }
    }
    
    bindEvents() {
        // Logo is just visual - no functionality needed
        
        // No click to expand functionality - sidebar always stays collapsed
        
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobile();
            });
        }
        
        // Navigation items
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                
                // Track navigation clicks with specific panel names
                if (window.pomodoroTimer) {
                    let panelName = section;
                    if (section === 'tasks') panelName = 'Tasks Panel';
                    else if (section === 'settings') panelName = 'Timer Panel';
                    else if (section === 'cassettes') panelName = 'Cassettes Panel';
                    
                    window.pomodoroTimer.trackEvent('Sidebar Panel Opened', {
                        panel_name: panelName,
                        section: section,
                        button_type: 'sidebar_navigation',
                        source: 'sidebar'
                    });
                }
                
                // For tasks, settings, music, and theme, active state is handled in their respective open/close methods
                if (section !== 'tasks' && section !== 'settings' && section !== 'music' && section !== 'theme') {
                    this.setActiveNavItem(section);
                }
                
                this.handleNavigation(section);
                
                // Close mobile sidebar after navigation
                if (this.isMobile) {
                    this.hideMobile();
                }
            });
        });
        
        // Overlay click to close sidebar AND all panels
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => {
                this.hideMobile();
                this.closeTaskPanel();
                this.closeSettingsPanel();
                this.closeImmersiveThemePanel();
            });
        }
        
        
        // Settings panel overlay click to close settings panel
        if (this.settingsPanelOverlay) {
            this.settingsPanelOverlay.addEventListener('click', () => {
                this.closeSettingsPanel();
            });
        }
        
        // Theme panel overlay click to close theme panel
        if (this.themePanelOverlay) {
            this.themePanelOverlay.addEventListener('click', () => {
                this.closeThemePanel();
            });
        }
        
        // Task panel overlay click to close task panel
        if (this.taskPanelOverlay) {
            this.taskPanelOverlay.addEventListener('click', () => {
                this.closeTaskPanel();
            });
        }
        
        // Close panel buttons (arrow left buttons)
        const closeTaskPanelBtn = document.getElementById('closeTaskPanel');
        if (closeTaskPanelBtn) {
            closeTaskPanelBtn.addEventListener('click', () => {
                this.closeTaskPanel();
            });
        }
        
        const closeSettingsPanelBtn = document.getElementById('closeSettingsPanel');
        if (closeSettingsPanelBtn) {
            closeSettingsPanelBtn.addEventListener('click', () => {
                this.closeSettingsPanel();
            });
        }
        
        const closeThemePanelBtn = document.getElementById('closeThemePanel');
        if (closeThemePanelBtn) {
            closeThemePanelBtn.addEventListener('click', () => {
                this.closeThemePanel();
            });
        }
        
        
        const closeImmersiveThemePanelBtn = document.getElementById('closeImmersiveThemePanel');
        if (closeImmersiveThemePanelBtn) {
            closeImmersiveThemePanelBtn.addEventListener('click', () => {
                this.closeImmersiveThemePanel();
            });
        }
        
        // Overlay is present but doesn't close panel on click
        // Panel only closes when clicking the Tasks button
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupResponsive() {
        if (this.isMobile) {
            this.sidebar.classList.add('hidden');
            this.sidebar.classList.remove('collapsed', 'expanded');
            this.mainContent.style.marginLeft = '0';
        } else {
            this.sidebar.classList.remove('hidden');
            this.sidebar.classList.remove('open');
            // Always keep sidebar collapsed on desktop
            this.sidebar.classList.add('collapsed');
            this.sidebar.classList.remove('expanded');
            this.mainContent.style.marginLeft = 'var(--sidebar-collapsed-width)';
        }
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            this.setupResponsive();
            
            // Reset mobile state
            if (!this.isMobile) {
                this.sidebar.classList.remove('open');
                if (this.sidebarOverlay) {
                    this.sidebarOverlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            }
        }
    }
    
    toggleCollapse() {
        console.log('toggleCollapse called, isMobile:', this.isMobile);
        
        if (this.isMobile) {
            this.toggleMobile();
            return;
        }
        
        // On desktop, do nothing - sidebar always stays collapsed
        console.log('Desktop mode - sidebar stays collapsed');
    }
    
    toggleMobile() {
        if (this.sidebar.classList.contains('open')) {
            this.hideMobile();
        } else {
            this.showMobile();
        }
    }
    
    showMobile() {
        this.sidebar.classList.add('open');
        this.sidebar.classList.remove('hidden');
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.add('active');
        }
        // Prevent body scroll when sidebar is open on mobile
        document.body.style.overflow = 'hidden';
    }
    
    hideMobile() {
        this.sidebar.classList.remove('open');
        this.sidebar.classList.add('hidden');
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.remove('active');
        }
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    setActiveNavItem(section) {
        this.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });
    }
    
    handleNavigation(section) {
        // Track sidebar navigation clicks in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'sidebar_navigation', {
                'event_category': 'navigation',
                'event_label': section,
                'value': 1
            });
            console.log(`📊 Sidebar navigation tracked: ${section}`);
        }
        
        switch (section) {
            case 'tasks':
                // Toggle task side panel
                this.toggleTaskPanel();
                break;
            case 'settings':
                // Toggle settings side panel
                this.toggleSettingsPanel();
                break;
            case 'immersive-theme':
                // Toggle immersive theme side panel
                this.toggleImmersiveThemePanel();
                break;
            case 'timer':
                // Scroll to timer section
                const timerSection = document.querySelector('.timer-section');
                if (timerSection) {
                    timerSection.scrollIntoView({ behavior: 'smooth' });
                }
                break;
            case 'statistics':
                // Open statistics modal or navigate to stats
                console.log('Navigate to statistics');
                break;
            case 'help':
                // Open help
                const helpToggle = document.getElementById('helpToggle');
                if (helpToggle) {
                    helpToggle.click();
                }
                break;
        }
    }
    
    toggleTaskPanel() {
        if (this.isTaskPanelOpen) {
            this.closeTaskPanel();
        } else {
            this.openTaskPanel();
        }
    }
    
    openTaskPanel() {
        if (this.taskSidePanel) {
            // Close other panels if open
            if (this.isSettingsPanelOpen) {
                this.closeSettingsPanel();
            }
            if (this.isImmersiveThemePanelOpen) {
                this.closeImmersiveThemePanel();
            }
            
            this.taskSidePanel.classList.add('open');
            this.isTaskPanelOpen = true;
            
            // Show overlay
            if (this.taskPanelOverlay) {
                this.taskPanelOverlay.classList.add('active');
            }
            
            // Set Tasks nav item as active
            this.setActiveNavItem('tasks');
            
            // Push main content to the right
            if (this.mainContent) {
                this.mainContent.classList.add('task-panel-open');
            }
            
            // Trigger rendering of tasks
            console.log('🟢 openTaskPanel - checking pomodoroTimer:', window.pomodoroTimer);
            if (window.pomodoroTimer) {
                console.log('🟢 Calling renderTasksInSidePanel');
                window.pomodoroTimer.renderTasksInSidePanel();
            } else {
                console.error('❌ window.pomodoroTimer not found!');
            }
        }
    }
    
    closeTaskPanel() {
        if (this.taskSidePanel) {
            this.taskSidePanel.classList.remove('open');
            this.isTaskPanelOpen = false;
            
            // Hide overlay
            if (this.taskPanelOverlay) {
                this.taskPanelOverlay.classList.remove('active');
            }
            
            // Remove active state from Tasks nav item
            const tasksNavItem = document.querySelector('.nav-item[data-section="tasks"]');
            if (tasksNavItem) {
                tasksNavItem.classList.remove('active');
            }
            
            // Reset main content position
            if (this.mainContent) {
                this.mainContent.classList.remove('task-panel-open');
            }
        }
    }
    
    
    toggleSettingsPanel() {
        if (this.isSettingsPanelOpen) {
            this.closeSettingsPanel();
        } else {
            this.openSettingsPanel();
        }
    }
    
    openSettingsPanel() {
        if (this.settingsSidePanel) {
            // Close other panels if open
            if (this.isTaskPanelOpen) {
                this.closeTaskPanel();
            }
            if (this.isImmersiveThemePanelOpen) {
                this.closeImmersiveThemePanel();
            }
            
            this.settingsSidePanel.classList.add('open');
            this.isSettingsPanelOpen = true;
            
            // Show overlay
            if (this.settingsPanelOverlay) {
                this.settingsPanelOverlay.classList.add('active');
            }
            
            // Set Settings nav item as active
            this.setActiveNavItem('settings');
            
            // Push main content to the right
            if (this.mainContent) {
                this.mainContent.classList.add('task-panel-open');
            }
            
            // Initialize settings panel controls
            if (window.pomodoroTimer) {
                window.pomodoroTimer.initializeSettingsSidePanel();
            }
        }
    }
    
    closeSettingsPanel() {
        if (this.settingsSidePanel) {
            this.settingsSidePanel.classList.remove('open');
            this.isSettingsPanelOpen = false;
            
            // Hide overlay
            if (this.settingsPanelOverlay) {
                this.settingsPanelOverlay.classList.remove('active');
            }
            
            // Remove active state from Settings nav item
            const settingsNavItem = document.querySelector('.nav-item[data-section="settings"]');
            if (settingsNavItem) {
                settingsNavItem.classList.remove('active');
            }
            
            // Reset main content position
            if (this.mainContent) {
                this.mainContent.classList.remove('task-panel-open');
            }
        }
    }
    

    toggleImmersiveThemePanel() {
        if (this.isImmersiveThemePanelOpen) {
            this.closeImmersiveThemePanel();
        } else {
            // 🎯 Track Sidebar Panel Opened event to Mixpanel
            if (window.mixpanelTracker) {
                window.mixpanelTracker.trackSidebarPanelOpened('immersive-theme');
                console.log('📊 Immersive theme panel opened event tracked to Mixpanel');
            }
            this.openImmersiveThemePanel();
        }
    }
    

    openImmersiveThemePanel() {
        if (this.immersiveThemeSidePanel) {
            // Close other panels if open
            if (this.isTaskPanelOpen) {
                this.closeTaskPanel();
            }
            if (this.isSettingsPanelOpen) {
                this.closeSettingsPanel();
            }
            if (this.isImmersiveThemePanelOpen) {
                this.closeImmersiveThemePanel();
            }
            
            this.immersiveThemeSidePanel.classList.add('open');
            this.isImmersiveThemePanelOpen = true;
            
            // Show overlay
            if (this.immersiveThemePanelOverlay) {
                this.immersiveThemePanelOverlay.classList.add('active');
            }
            
            // Set Theme nav item as active
            this.setActiveNavItem('immersive-theme');
            
            // Push main content to the right
            if (this.mainContent) {
                this.mainContent.classList.add('task-panel-open');
            }
            
            // Initialize immersive theme panel controls
            if (window.pomodoroTimer) {
                window.pomodoroTimer.initializeImmersiveThemePanel();
            }
        }
    }

    closeImmersiveThemePanel() {
        if (this.immersiveThemeSidePanel) {
            this.immersiveThemeSidePanel.classList.remove('open');
            this.isImmersiveThemePanelOpen = false;
            
            // Hide overlay
            if (this.immersiveThemePanelOverlay) {
                this.immersiveThemePanelOverlay.classList.remove('active');
            }
            
            // Remove active state from Theme nav item
            const themeNavItem = document.querySelector('.nav-item[data-section="immersive-theme"]');
            if (themeNavItem) {
                themeNavItem.classList.remove('active');
            }
            
            // Reset main content position
            if (this.mainContent) {
                this.mainContent.classList.remove('task-panel-open');
            }
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sidebarManager = new SidebarManager();
});// Force redeploy for admin key