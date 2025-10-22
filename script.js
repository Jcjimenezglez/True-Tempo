class PomodoroTimer {
    constructor() {
        
        
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
        if (!wasPro && this.isPro && this.isAuthenticated) {}
        
        if (this.isAuthenticated && this.user) {
            try { localStorage.setItem('hasAccount', 'true'); } catch (_) {}
            
            // Track user authentication (first time or returning)// Enable Timer panel features for authenticated users
            this.enableTimerPanelFeatures();
            
            // Auto-fix panel issues for authenticated users
            this.autoFixPanelIssues();this.openImmersiveThemePanel();
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