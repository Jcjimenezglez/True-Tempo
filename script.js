class PomodoroTimer {
    constructor() {
        // Pomodoro Technique structure
        this.workTime = 25 * 60; // 25 minutes
        this.shortBreakTime = 5 * 60; // 5 minutes
        this.longBreakTime = 15 * 60; // 15 minutes
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

        // Task execution queue (built from selected tasks and their session counts)
        this.taskQueue = [];
        this.currentTaskIndex = 0;
        this.currentTask = null;
        
        // Todoist integration (free users beta)
        this.todoistToken = localStorage.getItem('todoistToken') || '';
        this.todoistTasks = [];
        this.todoistProjectsById = {};
        this.currentTask = null; // { id, content, project_id }
        
		// Ambient sounds system
		this.ambientPlaying = false;
		// Default guest volume starts at 50% (0.5). Authenticated users will load saved volume in updateAuthState()
		this.ambientVolume = 0.5;
		// Persisted enable flag (default On)
		const savedAmbientEnabled = localStorage.getItem('ambientEnabled');
		this.ambientEnabled = savedAmbientEnabled === null ? true : savedAmbientEnabled === 'true';


		this.playlist = [
            "Chasing Clouds.mp3",
            "Clouds Drift By.mp3",
            "Clouds Drift By 2.mp3",
            "Cloudy Minds.mp3",
            "Cloudy Minds 2.mp3",
            "Coffee Clouds.mp3",
            "Coffee Clouds 2.mp3",
            "Dreaming in Loops.mp3",
            "Drift and Dream.mp3",
            "Drift and Dream 2.mp3",
            "Drifting in the Static.mp3",
            "Drifting in the Static 2.mp3",
            "Midnight Whispers.mp3",
            "Midnight Whispers 2.mp3",
            "Moonlit Scribbles.mp3",
            "Nightfall Notebook.mp3",
            "Nightfall Notebook 2.mp3",
            "Nightlight Dreams.mp3",
            "Under the Neon Moon.mp3",
            "Under the Neon Moon 2.mp3"
        ];
		this.currentTrackIndex = 0;
		// Fade/ducking state
		this.isDucked = false;
		this.duckRestoreTimer = null;
		this.fadeTimer = null;
        
        // Welcome modal elements
        this.welcomeModalOverlay = document.getElementById('welcomeModalOverlay');
        this.welcomeLoginBtn = document.getElementById('welcomeLoginBtn');
        this.welcomeSignupBtn = document.getElementById('welcomeSignupBtn');
        this.stayLoggedOutBtn = document.getElementById('stayLoggedOutBtn');
        
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
				this.nextTrack();
			});
        }

		// Shuffle playlist order on each load so it doesn't always start with the same track
		this.shufflePlaylist();
        
        // Auth elements
        this.authContainer = document.getElementById('authContainer');
        this.loginButton = document.getElementById('loginButton');
        this.signupButton = document.getElementById('signupButton');
        
        // Logo and achievement elements
        this.logoIcon = document.getElementById('logoIcon');
        this.achievementIcon = document.getElementById('achievementIcon');
        this.achievementCounter = document.getElementById('achievementCounter');
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
        this.confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        this.cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        
        // Auth state
        this.isAuthenticated = false;
        this.user = null;
        
        // Task form state
        this.editingTaskId = null;
        
        // Audio state
        this.currentAudio = null;
        this.cassetteSounds = null;
        
        // Selection restore flags
        this.hasAppliedSavedTechnique = false;
        this.pendingSelectedTechnique = null;

        this.init();
    }
    
    init() {
        this.layoutSegments();
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateSessionInfo();
        this.bindEvents();
        this.updateTechniqueTitle();
        this.loadAudio();
        this.loadCassetteSounds();
        this.updateNavigationButtons();
        this.initClerk();
        
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
        this.checkWelcomeModal();
        
        // Additional check when page is fully loaded
        if (document.readyState === 'complete') {
            setTimeout(() => this.checkAuthState(), 2000);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.checkAuthState(), 2000);
            });
        }

        // Build task queue at startup
        this.rebuildTaskQueue();

        // Update task button state on startup
        this.updateTaskButtonState();

        // Ensure badge shows current total focus time immediately
        this.updateFocusHoursDisplay();
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
            
            this.updateAuthState();
            // Auth may have hydrated; attempt to apply saved technique now
            this.applySavedTechniqueOnce();
            
            // Force check auth state after a short delay to catch post-redirect state
            setTimeout(() => {
                this.checkAuthState();
            }, 1000);
            
            // Additional check after longer delay to ensure UI updates
            setTimeout(() => {
                this.checkAuthState();
            }, 3000);
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
                    this.isAuthenticated = false;
                    this.user = null;
                    this.updateAuthState();
                    console.log('No authenticated user found');
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
    
    updateAuthState() {
        console.log('Updating auth state:', { isAuthenticated: this.isAuthenticated, user: this.user });
        
        // Force check current auth state from Clerk
        if (window.Clerk && window.Clerk.user) {
            this.isAuthenticated = true;
            this.user = window.Clerk.user;
        }
        
        if (this.isAuthenticated && this.user) {
            try { localStorage.setItem('hasAccount', 'true'); } catch (_) {}
            if (this.authContainer) this.authContainer.style.display = 'none';
            if (this.userProfileContainer) this.userProfileContainer.style.display = 'flex';
            // Always show logo, never show achievement icon
            if (this.logoIcon) this.logoIcon.style.display = 'flex';
            if (this.achievementIcon) this.achievementIcon.style.display = 'none';
            this.updateUserProfile();
            // Initialize cycle counter for authenticated users
            this.initializeCycleCounter();
            // Also update badge immediately
            this.updateFocusHoursDisplay();
            // Update premium UI
            this.updatePremiumUI();
            // Reconciliar premium desde backend
            this.refreshPremiumFromServer().catch(() => {});
            // Hide welcome modal if user is authenticated
            this.hideWelcomeModal();
            console.log('User is authenticated, showing profile avatar');

            // Ensure developer tab visibility according to current user
            this.updateDeveloperTabVisibility();

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
        } else {
            // Reset technique ASAP for snappy UI when user is not authenticated
            this.resetToDefaultTechniqueIfNeeded();

            // Clear Todoist tasks when user is not authenticated
            this.clearTodoistTasks();
            
            if (this.authContainer) this.authContainer.style.display = 'flex';
            if (this.userProfileContainer) this.userProfileContainer.style.display = 'none';
            // Always show logo, never show achievement icon
            if (this.logoIcon) this.logoIcon.style.display = 'flex';
            if (this.achievementIcon) this.achievementIcon.style.display = 'none';
            if (this.loginButton) this.loginButton.textContent = 'Login';
            // Don't force display of signup button - let CSS handle mobile visibility
            if (this.signupButton) this.signupButton.style.display = '';
            console.log('User is not authenticated, showing login/signup buttons');
            // Reset badge to zero time for guests
            if (this.achievementCounter) {
                this.achievementCounter.textContent = '00h:00m';
            }
            // Ensure guest default volume (50%) when not authenticated
            this.ambientVolume = 0.5;
            if (this.backgroundAudio) this.backgroundAudio.volume = this.ambientVolume;
            // Hide developer tab when not authenticated
            this.updateDeveloperTabVisibility();
            // reset already handled at top of branch
        }
        
        // Update dropdown badges based on authentication state
        this.updateDropdownState();
    }

    // Close all open modals to focus on timer
    closeAllModals() {
        // Close focus stats overlay (Tasks, Stats, etc.)
        const focusStatsOverlays = document.querySelectorAll('.focus-stats-overlay');
        focusStatsOverlays.forEach(overlay => {
            try { document.body.removeChild(overlay); } catch (_) {}
        });
        
        // Close welcome modal
        const welcomeModal = document.getElementById('welcomeModalOverlay');
        if (welcomeModal) welcomeModal.style.display = 'none';
        
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

    // Controls visibility of the Developer tab based on current user
    updateDeveloperTabVisibility() {
        const developerTab = document.querySelector('[data-tab="developer"]');
        const developerContent = document.getElementById('developer-tab');
        const developerDropdownItem = document.getElementById('developerButton');
        
        if (!developerTab || !developerContent) return;

        const user = (window.Clerk && window.Clerk.user) ? window.Clerk.user : this.user;
        let isDeveloper = false;
        if (user) {
            try {
                if (user.emailAddresses && user.emailAddresses.length > 0) {
                    isDeveloper = user.emailAddresses.some(e => e.emailAddress === 'jcjimenezglez@gmail.com');
                } else if (user.primaryEmailAddress && user.primaryEmailAddress.emailAddress) {
                    isDeveloper = user.primaryEmailAddress.emailAddress === 'jcjimenezglez@gmail.com';
                } else if (user.emailAddress) {
                    isDeveloper = user.emailAddress === 'jcjimenezglez@gmail.com';
                }
            } catch (_) {}
        }

        if (isDeveloper) {
            developerTab.style.display = '';
            developerContent.style.display = '';
            if (developerDropdownItem) developerDropdownItem.style.display = '';
        } else {
            developerTab.style.display = 'none';
            developerContent.style.display = 'none';
            if (developerDropdownItem) developerDropdownItem.style.display = 'none';
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

        // Built-in technique
        const item = document.querySelector(`[data-technique="${saved}"]`);
        if (item) {
            const requiresAccount = item.dataset.requiresAccount === 'true';
            if (requiresAccount && !this.isAuthenticated) {
                // Defer until auth is ready; do NOT mark as applied yet
                this.pendingSelectedTechnique = saved;
                return;
            }
            this.selectTechnique(item);
            this.hasAppliedSavedTechnique = true;
            return;
        }

        // Unknown saved technique → mark applied
        this.hasAppliedSavedTechnique = true;
    }

    updateUserProfile() {
        if (!this.user) return;
        
        // Update user email in dropdown
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            const email = this.user.primaryEmailAddress?.emailAddress || this.user.emailAddresses?.[0]?.emailAddress || 'user@example.com';
            userEmailElement.textContent = email;
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
    
    async performLogout() {
        try {
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
            
            // Mark that user just logged out to prevent welcome modal
            try { sessionStorage.setItem('just_logged_out', 'true'); } catch (_) {}
            
            // Optimistic UI update
            this.isAuthenticated = false;
            this.user = null;
            // Clear Todoist tasks when user logs out
            this.clearTodoistTasks();
            this.updateAuthState();

            // Sign out from Clerk (all sessions) without adding extra query params
            try {
                await window.Clerk.signOut({ signOutAll: true });
            } catch (_) { /* ignore */ }

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
                window.Clerk.redirectToSignIn({
                    fallbackRedirectUrl: window.location.origin + window.location.pathname,
                });
            }
        } catch (error) {
            console.error('Login/logout failed:', error);
        }
    }

    async handleSignup() {
        try {
            console.log('Redirecting to Clerk hosted Sign Up...');
            window.location.href = 'https://accounts.superfocus.live/sign-up?redirect_url=' + encodeURIComponent(window.location.href);
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
        this.techniqueDropdown.classList.toggle('open');
    }
    
    closeDropdown() {
        this.techniqueDropdown.classList.remove('open');
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
    }
    
    loadTechnique(technique) {
        // Avoid redundant loads
        if (this.currentTechniqueKey === technique) {
            return;
        }

        // Different timer configurations based on technique
        switch(technique) {
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
        
        // Clear existing segments
        progressSegments.innerHTML = '';
        
        // Create segments based on current technique
        this.cycleSections.forEach((section, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', `progress-segment ${section.type}-segment`);
            circle.setAttribute('data-section', index + 1);
            circle.setAttribute('data-minutes', section.duration / 60);
            circle.setAttribute('cx', '50');
            circle.setAttribute('cy', '50');
            circle.setAttribute('r', '45');
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke-width', '4');
            circle.setAttribute('stroke-linecap', 'round');
            circle.setAttribute('stroke-linejoin', 'round');
            
            // Set stroke color based on section type
            if (section.type === 'work') {
                circle.setAttribute('stroke', 'url(#liquidGlassOverlay)');
            } else if (section.type === 'break') {
                circle.setAttribute('stroke', 'url(#liquidGlassOverlay)');
            } else if (section.type === 'long-break') {
                circle.setAttribute('stroke', 'url(#liquidGlassOverlay)');
            }
            
            progressSegments.appendChild(circle);
        });
        
        // Update overlays
        const progressOverlays = document.querySelector('.progress-overlays');
        if (progressOverlays) {
            progressOverlays.innerHTML = '';
            
            this.cycleSections.forEach((section, index) => {
                const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                overlay.setAttribute('class', 'progress-overlay');
                overlay.setAttribute('data-ol', index + 1);
                overlay.setAttribute('cx', '50');
                overlay.setAttribute('cy', '50');
                overlay.setAttribute('r', '45');
                overlay.setAttribute('fill', 'none');
                overlay.setAttribute('stroke-width', '4');
                overlay.setAttribute('stroke-linecap', 'round');
                overlay.setAttribute('stroke-linejoin', 'round');
                overlay.setAttribute('stroke', 'url(#liquidGlassOverlay)');
                
                progressOverlays.appendChild(overlay);
            });
        }
        
        // Refresh cached NodeLists so subsequent layout uses the new elements
        this.progressSegments = document.querySelectorAll('.progress-segment');
        this.progressOverlays = document.querySelectorAll('.progress-overlay');

        // Re-layout segments with new configuration and update progress visuals
        this.layoutSegments();
        this.updateProgress();
    }

    // Layout segments proportionally starting from 12 o'clock, with small gaps
    layoutSegments() {
        const CIRCUMFERENCE = 2 * Math.PI * 45; // 283
        // Target visible gap 2px → with round caps and width 4, use GAP ≈ 6
        const GAP = 6;

        // Use cycleSections data instead of DOM
        const minutes = this.cycleSections.map(section => section.duration / 60); // Convert seconds to minutes
        const totalMinutes = minutes.reduce((a, b) => a + b, 0);

        // Compute raw lengths proportionally based on actual duration
        const lengths = minutes.map(m => (m / totalMinutes) * CIRCUMFERENCE);

        // Apply gaps: ensure each gap is GAP length, subtract proportionally from each segment
        const totalGaps = GAP * this.cycleSections.length;
        const scale = (CIRCUMFERENCE - totalGaps) / CIRCUMFERENCE;
        const scaledLengths = lengths.map(len => Math.max(6, len * scale)); // min length
        this._segmentMeta = { CIRCUMFERENCE, GAP, scaledLengths };

        // Set dasharray and offsets so the first segment starts at 12 o'clock.
        // Because we rotate the group and indicator -90deg in CSS, here we start at 0.
        let offset = 0;
        this.progressSegments.forEach((seg, idx) => {
            if (idx < scaledLengths.length) {
                const segLen = scaledLengths[idx];
                seg.setAttribute('stroke-dasharray', `${segLen} ${CIRCUMFERENCE}`);
                seg.setAttribute('stroke-dashoffset', `${-offset}`);
                offset += segLen + GAP;
            } else {
                // Hide extra segments if current technique has fewer sections
                seg.style.display = 'none';
            }
        });
    }
    
    bindEvents() {
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.prevSectionBtn.addEventListener('click', () => this.goToPreviousSection());
        this.nextSectionBtn.addEventListener('click', () => this.goToNextSection());
        this.musicToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMusic();
        });
        this.taskToggleBtn.addEventListener('click', () => this.toggleTaskList());
        this.techniqueTitle.addEventListener('click', () => this.toggleDropdown());
        
        // Custom timer event listeners
        this.closeCustomTimer.addEventListener('click', () => this.hideCustomTimerModal());
        this.cancelCustomTimer.addEventListener('click', () => this.hideCustomTimerModal());
        this.saveCustomTimer.addEventListener('click', () => this.saveCustomTimerConfig());
        
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

            if (!this.techniqueDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Handle dropdown item selection
        this.dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't select technique if clicking on learn more link
                if (e.target.classList.contains('learn-more-link')) {
                    e.stopPropagation();
                    this.showTechniqueInfo(e.target.dataset.technique);
                    return;
                }

                const technique = item.getAttribute('data-technique');
                if (technique === 'custom') {
                    e.stopPropagation();
                    this.handleCustomTechniqueClick(item);
                    return;
                }
                this.selectTechnique(item);
            });
        });
        
        // Setup welcome modal events
        this.setupWelcomeModalEvents();
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Handle login button
        if (this.loginButton) {
            this.loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Handle signup button
        if (this.signupButton) {
            this.signupButton.addEventListener('click', (e) => {
                e.preventDefault();
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

        // Close modals when clicking overlay
        const upgradeModal = document.getElementById('upgradeModal');
        if (upgradeModal) {
            upgradeModal.addEventListener('click', (e) => {
                if (e.target === upgradeModal) {
                    this.hideUpgradeModal();
                }
            });
        }

        // Settings modal tab navigation
        this.setupSettingsTabs();
        
        // View mode toggle buttons
        this.setupViewModeButtons();

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
                this.resetFocusStats();
                this.hideSettingsModal();
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
                } else if (text === 'Developer') {
                    e.preventDefault();
                    this.showDeveloperModal();
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
        }
        
        if (this.cancelLogoutBtn) {
            this.cancelLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLogoutModal();
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
    }

    showUpgradeModal() {
        const upgradeModal = document.getElementById('upgradeModal');
        if (upgradeModal) {
            upgradeModal.style.display = 'flex';
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
            // Ensure developer tab visibility at open time
            this.updateDeveloperTabVisibility();
            settingsModal.style.display = 'flex';
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

    showDeveloperModal() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            // Switch to developer tab and make it active
            this.switchToSettingsTab('developer');
            // Make developer nav item active
            const developerNav = document.querySelector('[data-tab="developer"]');
            if (developerNav) {
                developerNav.classList.add('active');
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
        const forcedMode = localStorage.getItem('viewMode');
        if (forcedMode === 'pro') return true;
        if (forcedMode === 'free' || forcedMode === 'guest') return false;
        
        // Prefer Clerk metadata when available
        try {
            if (window.Clerk && window.Clerk.user) {
                const meta = window.Clerk.user.publicMetadata || {};
                if (meta.isPremium === true) return true;
            }
        } catch (_) {}

        const urlParams = new URLSearchParams(window.location.search);
        const hasPremiumParam = urlParams.get('premium') === '1';
        const hasPremiumStorage = localStorage.getItem('isPremium') === 'true';
        const hasPaidSubscription = localStorage.getItem('hasPaidSubscription') === 'true';
        if (hasPremiumParam) {
            localStorage.setItem('isPremium', 'true');
            localStorage.setItem('hasPaidSubscription', 'true');
            return true;
        }
        return hasPremiumStorage || hasPaidSubscription;
    }

    // Simple ambient sounds system
    toggleMusic() {
        this.showAmbientModal();
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

    showAmbientModal() {
        const initialVolumePct = Math.round(this.ambientVolume * 100);
        const isEnabled = this.ambientEnabled;
        const modalContent = `
            <div class="focus-stats-modal background-music-modal">
                <button class="close-focus-stats-x">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                    </svg>
                </button>
                <div class="modal-header">
                    <h3>Background Music</h3>
                    <p class="modal-subtitle">Enhance your focus with ambient sounds</p>
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
                                    <h4>Lofi Music</h4>
                                    <p>Relaxing beats for deep focus</p>
                                </div>
                            </div>
                            <div class="toggle-container">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="lofiToggle" ${isEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
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

        // Event listeners
        modalOverlay.querySelector('.close-focus-stats-x').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        const volumeSlider = modalOverlay.querySelector('#ambientVolume');
        const volumeValue = modalOverlay.querySelector('#ambientVolumeValue');
        const lofiToggle = modalOverlay.querySelector('#lofiToggle');
        const previewBtn = modalOverlay.querySelector('#previewBtn');
        
        // Initialize controls with current state
        volumeSlider.disabled = !isEnabled;
		if (previewBtn) previewBtn.disabled = !isEnabled;

        // Toggle logic with persistence
        lofiToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.ambientEnabled = enabled;
            localStorage.setItem('ambientEnabled', String(enabled));
            volumeSlider.disabled = !enabled;
			if (previewBtn) previewBtn.disabled = !enabled;
            
            if (!enabled) {
                this.stopPlaylist();
				if (previewBtn) previewBtn.textContent = 'Preview';
            }
        });

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
        this.backgroundAudio.src = '/audio/lofi/' + this.playlist[this.currentTrackIndex];
        this.backgroundAudio.loop = false;
        this.backgroundAudio.volume = this.ambientVolume;
        try { await this.backgroundAudio.play(); } catch (_) {}
        this.ambientPlaying = true;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }

    stopPlaylist() {
        if (!this.backgroundAudio) return;
        try { this.backgroundAudio.pause(); } catch (_) {}
        this.ambientPlaying = false;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.remove('playing');
    }

    pausePlaylist() {
        if (!this.backgroundAudio) return;
        try { this.backgroundAudio.pause(); } catch (_) {}
        this.ambientPlaying = false;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.remove('playing');
    }

    resumePlaylist() {
        if (!this.backgroundAudio) return;
        if (!this.ambientEnabled) return;
        try { this.backgroundAudio.play(); } catch (_) {}
        this.ambientPlaying = true;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }

    setAmbientVolume(vol) {
        this.ambientVolume = Math.max(0, Math.min(1, vol));
        localStorage.setItem('ambientVolume', String(this.ambientVolume));
        if (this.backgroundAudio) this.backgroundAudio.volume = this.ambientVolume;
    }

    // Smooth fades
    fadeMusicTo(targetVolume, durationMs) {
        if (!this.backgroundAudio) return;
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
        const target = this.ambientVolume;
        if (this.backgroundAudio.volume > 0.001) this.backgroundAudio.volume = 0;
        this.fadeMusicTo(target, durationMs);
    }

    fadeMusicOut(durationMs) {
        if (!this.backgroundAudio) return;
        this.fadeMusicTo(0, durationMs);
    }

    nextTrack() {
        if (!this.playlist || this.playlist.length === 0 || !this.backgroundAudio) return;
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.backgroundAudio.src = '/audio/lofi/' + this.playlist[this.currentTrackIndex];
        this.backgroundAudio.volume = this.ambientVolume;
        this.backgroundAudio.play().catch(() => {});
        this.ambientPlaying = true;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }

    prevTrack() {
        if (!this.playlist || this.playlist.length === 0 || !this.backgroundAudio) return;
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.backgroundAudio.src = '/audio/lofi/' + this.playlist[this.currentTrackIndex];
        this.backgroundAudio.volume = this.ambientVolume;
        this.backgroundAudio.play().catch(() => {});
        this.ambientPlaying = true;
        if (this.musicToggleBtn) this.musicToggleBtn.classList.add('playing');
    }

    shufflePlaylist() {
        for (let i = this.playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
        }
    }

    updatePremiumUI() {
        const upgradeButton = document.getElementById('upgradeToProButton');
        const manageSubscriptionButton = document.getElementById('manageSubscriptionButton');
        const userProBadge = document.getElementById('userProBadge');
        const integrationsButton = document.getElementById('integrationsButton');
        
        if (this.isPremiumUser()) {
            // Show Manage subscription, hide Upgrade, show Pro badge, show Integrations
            if (upgradeButton) upgradeButton.style.display = 'none';
            if (manageSubscriptionButton) manageSubscriptionButton.style.display = 'flex';
            if (userProBadge) userProBadge.style.display = 'inline-block';
            if (integrationsButton) integrationsButton.style.display = 'flex';
        } else {
            // Show Upgrade, hide Manage subscription, hide Pro badge, hide Integrations
            if (upgradeButton) upgradeButton.style.display = 'flex';
            if (manageSubscriptionButton) manageSubscriptionButton.style.display = 'none';
            if (userProBadge) userProBadge.style.display = 'none';
            if (integrationsButton) integrationsButton.style.display = 'none';
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
    
    startTimer() {
        this.isRunning = true;
        this.startPauseBtn.classList.add('running');
        this.playUiSound('play');
        
        // Close all open modals to focus on timer
        this.closeAllModals();
        
        // Resume background music if enabled (persisted flag)
        if (this.ambientEnabled) {
            if (this.backgroundAudio && this.backgroundAudio.src && this.backgroundAudio.currentTime > 0) {
                // Music was paused, resume from where it left off
                this.resumePlaylist();
            } else {
                // No music was playing, start fresh
            this.playPlaylist();
            }
        }
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            this.updateSections();
            this.updateSessionInfo();
            // Music ducking: fade out 2s before end of section to prioritize alerts
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
        
        // Close all open modals to focus on timer
        this.closeAllModals();
        
        // Pause background music if playing
        if (this.ambientPlaying) {
            this.pausePlaylist();
        }
        
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
        if (this.ambientPlaying) {
            this.pausePlaylist();
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
        // Only handle shortcuts if no input/textarea is focused
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Space or Enter to toggle timer
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault(); // Prevent page scroll on space
            this.toggleTimer();
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
        }

        // Load current section data
        const currentSectionInfo = this.cycleSections[this.currentSection - 1];
        this.timeLeft = currentSectionInfo.duration;
        this.isWorkSession = currentSectionInfo.type === 'work';
        this.isLongBreak = currentSectionInfo.type === 'long-break';
        
        // Update UI to reflect the next section
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
                titleText = 'Focus';
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
        
        // Build progress distance in SVG units INCLUDING gaps so that
        // segment starts line up perfectly with visual gaps.
        const { GAP, scaledLengths } = this._segmentMeta;
        let distanceWithGaps = 0;
        // Sum fully completed previous segments (length + gap each)
        for (let i = 0; i < this.currentSection - 1 && i < scaledLengths.length; i++) {
            distanceWithGaps += scaledLengths[i] + GAP;
        }
        // Add partial length within current segment
        const currentSegIndex = Math.min(this.currentSection - 1, scaledLengths.length - 1);
        const currentSegLen = scaledLengths[currentSegIndex] || 0;
        distanceWithGaps += currentSegLen * sectionProgress;
        
        // Update overlays based on computed distance along whole ring (with gaps)
        this.updateSegmentedProgress(distanceWithGaps);
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
        if (!this.taskQueue || this.taskQueue.length === 0) return 'Focus';
        const current = this.taskQueue[this.currentTaskIndex] || null;
        // Return "Focus" for empty slots (sessions without assigned tasks)
        if (!current || current.source === 'empty' || !current.content) return 'Focus';
        return current.content;
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
            
            await fetch(`/api/todoist-complete?id=${encodeURIComponent(originalId)}`, {
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
            
            // Call the API to mark task as completed in Todoist (using query parameter)
            await fetch(`/api/todoist-complete?id=${encodeURIComponent(originalId)}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error completing Todoist task:', error);
        }
    }

    showTaskCompletedModal() {}
    
    updateSessionInfo() {
        const currentSectionInfo = this.cycleSections[this.currentSection - 1];
        
        // Calculate progress percentage
        let totalCycleProgress = 0;
        for (let i = 0; i < this.currentSection - 1; i++) {
            totalCycleProgress += this.cycleSections[i].duration;
        }
        totalCycleProgress += (currentSectionInfo.duration - this.timeLeft);
        
        // Calculate total cycle time dynamically
        const totalCycleTime = this.cycleSections.reduce((total, section) => total + section.duration, 0);
        const progressPercentage = Math.round((totalCycleProgress / totalCycleTime) * 100);
        
        // Format as "X/Y Sessions (Z%)"
        const sessionNumber = this.currentSection;
        const totalSessions = this.cycleSections.length;
        let text = `${sessionNumber}/${totalSessions} Sessions (${progressPercentage}%)`;
        this.sessionInfoElement.textContent = text;
        
        // Update current task display
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
            if (this.currentTaskName) {
                this.currentTaskElement.textContent = this.currentTaskName;
                this.currentTaskElement.style.display = 'block';
            } else {
                // Show "Focus" when no task is assigned
                this.currentTaskElement.textContent = 'Focus';
                this.currentTaskElement.style.display = 'block';
            }
        }
    }

    updateCurrentTaskFromQueue() {
        // Update current task based on task queue and current session
        if (this.isWorkSession && this.taskQueue && this.taskQueue.length > 0) {
            // Calculate how many task slots have been completed so far
            const selected = this.getSelectedTasks();
            let slotsCompleted = 0;
            selected.forEach(task => {
                const cfg = this.getTaskConfig(task.id);
                const total = Math.max(1, cfg.sessions || 1);
                const done = Math.min(cfg.completedSessions || 0, total);
                slotsCompleted += done;
            });
            
            if (slotsCompleted >= this.taskQueue.length) {
                this.currentTaskIndex = this.taskQueue.length; // beyond queue → Focus label
                this.currentTask = null;
                this.currentTaskName = null;
            } else {
                this.currentTaskIndex = slotsCompleted;
                this.currentTask = this.taskQueue[this.currentTaskIndex];
                this.currentTaskName = this.currentTask ? this.currentTask.content : null;
            }
        } else if (this.isWorkSession) {
            // In work session but no tasks selected - show "Focus"
            this.currentTask = null;
            this.currentTaskName = null;
        } else {
            // Not in work session
            this.currentTask = null;
            this.currentTaskName = null;
        }
        
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
    
    checkWelcomeModal() {
        // Wait a bit to ensure auth state is properly checked
        setTimeout(() => {
            // Double check auth state
            if (window.Clerk && window.Clerk.user) {
                this.isAuthenticated = true;
                return; // Don't show for authenticated users
            }
            if (this.isAuthenticated) {
                return; // Don't show for authenticated users
            }

            // If this navigation is a plain reload, do not show modal
            try {
                const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
                const isReload = nav && nav.type === 'reload';
                if (isReload) {
                    return; // Refresh/F5 → never show
                }
            } catch (_) {}

            // Check if user just logged out - don't show modal after logout
            const justLoggedOut = sessionStorage.getItem('just_logged_out');
            if (justLoggedOut === 'true') {
                sessionStorage.removeItem('just_logged_out');
                return; // Don't show modal after logout
            }

            // First visit? mark and skip
            const hasVisitedBefore = localStorage.getItem('truetempo_has_visited');
            if (!hasVisitedBefore) {
                try { localStorage.setItem('truetempo_has_visited', 'true'); } catch (_) {}
                return;
            }

            // Returning guest (new navigation, not reload) → show modal
            this.showWelcomeModal();
        }, 1000); // slight delay so Clerk can hydrate
    }
    
    showWelcomeModal() {
        if (this.welcomeModalOverlay) {
            this.welcomeModalOverlay.style.display = 'flex';
        }
    }
    
    hideWelcomeModal() {
        if (this.welcomeModalOverlay) {
            this.welcomeModalOverlay.style.display = 'none';
        }
    }
    
    setupWelcomeModalEvents() {
        if (this.welcomeLoginBtn) {
            this.welcomeLoginBtn.addEventListener('click', () => {
                this.hideWelcomeModal();
                this.handleLogin();
            });
        }
        
        if (this.welcomeSignupBtn) {
            this.welcomeSignupBtn.addEventListener('click', () => {
                this.hideWelcomeModal();
                this.handleSignup();
            });
        }
        
        if (this.stayLoggedOutBtn) {
            this.stayLoggedOutBtn.addEventListener('click', () => {
                this.hideWelcomeModal();
            });
        }
    }

    loadCassetteSounds() {
        try {
            this.cassetteSounds = new Audio('audio/ui/cassette-player-button-1.mp3');
            this.cassetteSounds.volume = 0.3; // Set volume to 30%
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
    
    playProcessedCassetteSound(type) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Adjust pitch and speed only for pause
        if (type === 'play') {
            // Play: Original sound - no adjustments
            source.playbackRate.value = 1.0; // Normal speed
            source.detune.value = 0; // Original pitch
        } else {
            // Pause: Higher pitch and slower speed
            source.playbackRate.value = 0.6; // Slower
            source.detune.value = 500; // Higher pitch (cents)
        }
        
        // Set volume
        gainNode.gain.value = 0.3;
        
        // Play the sound
        source.start();
    }
    
    playSyntheticSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (type === 'play') {
                // Play: Cassette deck mechanical click - sharp and metallic
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();
                
                oscillator.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Cassette play click: 800Hz with metallic resonance
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.type = 'square'; // More metallic than sine
                
                // Band-pass filter for metallic sound
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(800, audioContext.currentTime);
                filter.Q.setValueAtTime(3, audioContext.currentTime);
                
                // Sharp attack, quick decay - like mechanical click
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.005);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.06);
                
            } else {
                // Pause: Cassette deck thunk - deeper mechanical sound
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();
                
                oscillator.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Cassette pause thunk: 200Hz with mechanical resonance
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.type = 'square'; // More mechanical than sine
                
                // Low-pass filter for deeper mechanical sound
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(400, audioContext.currentTime);
                filter.Q.setValueAtTime(2, audioContext.currentTime);
                
                // Slower attack, longer decay - like mechanical thunk
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.12);
            }
        } catch (_) { /* no-op */ }
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
                        await fetch(`/api/todoist-complete?id=${encodeURIComponent(task.id)}`, { method: 'POST' });
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
            
            ${isFreeUser ? `
                <div class="pro-upgrade-banner">
                    <div class="pro-banner-content">
                        <div class="pro-banner-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
                        <div class="pro-banner-text">
                            <h4>Upgrade to Pro</h4>
                            <p>Connect Todoist and sync your tasks across devices</p>
            </div>
                        <button class="pro-banner-btn" id="upgradeFromTasksBtn">Upgrade</button>
                    </div>
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

        // Add upgrade button event listener for free users
        if (isFreeUser) {
            const upgradeBtn = modal.querySelector('#upgradeFromTasksBtn');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    close();
                    this.showUpgradeModal();
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

    showTodoistConnectionPrompt() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '100002';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.style.maxWidth = '400px';
        modal.innerHTML = `
            <button class="close-focus-stats-x" id="closeConnectionPrompt">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <div class="tasks-header">
                <h3>Connect to Todoist</h3>
                <p class="tasks-subtitle">You need to connect your Todoist account to import tasks</p>
            </div>
            
            <div class="settings-section">
                <div class="settings-item">
                    <div class="settings-label-group">
                        <span class="settings-label">Todoist Integration</span>
                        <span class="settings-description">Connect your Todoist account to import tasks and enhance your focus sessions.</span>
                    </div>
                    <div class="integration-actions">
                        <button class="btn-primary" id="connectTodoistPromptBtn">Connect to Todoist</button>
                        <button class="btn-secondary" id="cancelConnectionPrompt">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Setup event listeners
        const closeBtn = modal.querySelector('#closeConnectionPrompt');
        const connectBtn = modal.querySelector('#connectTodoistPromptBtn');
        const cancelBtn = modal.querySelector('#cancelConnectionPrompt');

        const closeModal = () => {
            document.body.removeChild(overlay);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        connectBtn.addEventListener('click', () => {
            // Redirect to Todoist auth
            window.location.href = '/api/todoist-auth-start';
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
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
                // Fetch both tasks and projects
                const [tasksResponse, projectsResponse] = await Promise.all([
                    fetch('/api/todoist-tasks'),
                    fetch('/api/todoist-projects')
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
                
                // Debug: Log tasks to see project_name values
                console.log('Todoist tasks:', tasks);
                console.log('Project names found:', [...new Set(tasks.map(t => t.project_name))]);
                
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
                
                // Debug: Log grouped projects
                console.log('Grouped projects:', Object.keys(tasksByProject));
                
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
            
            // Show success message
            alert(`Successfully imported ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}!`);
            
        } catch (error) {
            console.error('Error importing Todoist tasks:', error);
            throw error;
        }
    }

    refreshTaskModalIfOpen() {
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
                
                // Update task button state
                this.updateTaskButtonState();
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
        // Task item click listeners (select task, not checkbox)
        const taskItems = modal.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on the menu or checkbox
                if (e.target.closest('.task-menu') || e.target.closest('.task-checkbox')) {
                    return;
                }
                
                const taskId = item.dataset.taskId;
                const currentConfig = this.getTaskConfig(taskId);
                const newSelected = !currentConfig.selected;
                
                // Toggle selection
                this.setTaskConfig(taskId, { ...currentConfig, selected: newSelected });
                
                // Update visual state
                this.updateTaskSelectionVisual(modal, taskId, newSelected);
                
                // Update the main timer banner
                this.updateCurrentTaskBanner();
                this.rebuildTaskQueue();
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
        
        if (!taskBanner) {
            // Create task banner if it doesn't exist
            this.createTaskBanner();
            return;
        }

        if (selectedTasks.length === 0) {
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
        
        // Get selected tasks
        const selectedTasks = allTasks.filter(task => {
            const config = this.getTaskConfig(task.id);
            // Only include tasks that are selected AND not completed
            return config.selected && !task.completed;
        }).map(task => {
            const config = this.getTaskConfig(task.id);
            return {
                ...task,
                sessions: config.sessions || 1
            };
        });
        
        // Apply saved task order
        const savedOrder = this.getTaskOrder();
        if (savedOrder.length > 0) {
            // Create a map for quick lookup
            const taskMap = new Map(selectedTasks.map(task => [task.id, task]));
            
            // Sort by saved order
            const orderedTasks = [];
            savedOrder.forEach(orderItem => {
                if (taskMap.has(orderItem.id)) {
                    orderedTasks.push(taskMap.get(orderItem.id));
                    taskMap.delete(orderItem.id);
                }
            });
            
            // Add any remaining tasks that weren't in the saved order
            taskMap.forEach(task => orderedTasks.push(task));
            
            return orderedTasks;
        }
        
        return selectedTasks;
    }

    // Local task management
    getLocalTasks() {
        return JSON.parse(localStorage.getItem('localTasks') || '[]');
    }

    setLocalTasks(tasks) {
        localStorage.setItem('localTasks', JSON.stringify(tasks));
    }

    getAllTasks() {
        const localTasks = this.getLocalTasks();
        const todoistTasks = this.isAuthenticated && this.user && this.isPro ? (this.todoistTasks || []) : [];
        
        // Combine and mark source
        const allTasks = [
            ...localTasks.map(task => ({ ...task, source: 'local' })),
            ...todoistTasks.map(task => ({ ...task, source: 'todoist' }))
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
            completed: false
        };
        
        tasks.push(newTask);
        this.setLocalTasks(tasks);
        // Persist planned sessions so the card progress matches the chosen value
        this.setTaskConfig(newTask.id, { sessions: pomodoros, selected: true, completedSessions: 0 });
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
            // Load projects
            const projectsRes = await fetch('/api/todoist-projects');
            const projects = projectsRes.ok ? await projectsRes.json() : [];
            
            // Load tasks
            const tasksRes = await fetch('/api/todoist-tasks');
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
        this.showTaskListModal();
    }

    clearAllTasks() {
        if (confirm('Are you sure you want to clear all tasks?')) {
            this.setLocalTasks([]);
            // Explicit clear is OK here since the user is clearing everything
            localStorage.removeItem('taskConfigs');
            this.showTaskListModal();
        }
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
            // Fetch projects via proxy
            const projRes = await fetch('/api/todoist-projects');
            if (projRes.ok) {
                const projects = await projRes.json();
                this.todoistProjectsById = {};
                projects.forEach(p => { this.todoistProjectsById[p.id] = p; });
            } else {
                this.todoistProjectsById = {};
            }

            // Fetch tasks via proxy
            const tasksRes = await fetch('/api/todoist-tasks');
            if (tasksRes.ok) {
                const tasks = await tasksRes.json();
                this.todoistTasks = tasks;
            } else {
                this.todoistTasks = [];
            }
        } catch (_) {
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
        // Track total technique time (focus + breaks) for Most Used Technique
        const hours = seconds / 3600;
        const stats = this.getFocusStats();
        const technique = this.getCurrentTechniqueName();

        if (!stats.techniqueTime) stats.techniqueTime = {};
        stats.techniqueTime[technique] = (stats.techniqueTime[technique] || 0) + hours;

        localStorage.setItem('focusStats', JSON.stringify(stats));
    }

    addFocusHours(hours) {
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
        
        // Hide Developer tab if user is not the developer
        const developerTab = document.querySelector('[data-tab="developer"]');
        const developerContent = document.getElementById('developer-tab');
        
        if (developerTab && developerContent) {
            // Check if user is the developer
            let isDeveloper = false;
            
            if (this.user) {
                // Try different ways to access the email
                if (this.user.emailAddresses && this.user.emailAddresses.length > 0) {
                    isDeveloper = this.user.emailAddresses.some(email => 
                        email.emailAddress === 'jcjimenezglez@gmail.com'
                    );
                } else if (this.user.primaryEmailAddress) {
                    isDeveloper = this.user.primaryEmailAddress.emailAddress === 'jcjimenezglez@gmail.com';
                } else if (this.user.emailAddress) {
                    isDeveloper = this.user.emailAddress === 'jcjimenezglez@gmail.com';
                }
            }
            
            console.log('User object:', this.user);
            console.log('Is developer:', isDeveloper);
            
            if (!isDeveloper) {
                developerTab.style.display = 'none';
                developerContent.style.display = 'none';
            }
        }
        
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
        
        // Setup Todoist integration controls in settings
        this.setupTodoistIntegrationControls();
        
        // Check if user just connected to Todoist and should open task list
        this.checkTodoistConnectionRedirect();
    }
    
    checkTodoistConnectionRedirect() {
        // Check if user just connected to Todoist
        const urlParams = new URLSearchParams(window.location.search);
        const todoistConnected = urlParams.get('todoist');
        
        if (todoistConnected === 'connected') {
            // Remove the parameter from URL without page reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            // Show success message and open task list
            setTimeout(() => {
                this.showTodoistConnectionSuccess();
            }, 1000); // Small delay to let the page fully load
        }
    }

    showTodoistConnectionSuccess() {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'todoist-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span>Successfully connected to Todoist!</span>
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
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        // Open task list modal automatically
        setTimeout(() => {
            this.showTaskListModal();
        }, 500);
    }

    setupTodoistIntegrationControls() {
        const connectBtn = document.getElementById('connectTodoistBtn');
        const disconnectBtn = document.getElementById('disconnectTodoistBtn');
        const statusText = document.getElementById('todoistStatusText');
        
        if (!connectBtn || !disconnectBtn || !statusText) return;
        
        connectBtn.addEventListener('click', () => {
            window.location.href = '/api/todoist-auth-start';
        });

        disconnectBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/todoist-disconnect', { method: 'POST' });
            } catch (_) {}
            statusText.textContent = 'Disconnected';
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
                    statusText.textContent = 'Connected to Todoist';
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = '';
                    this.fetchTodoistData();
                } else {
                    statusText.textContent = 'Disconnected';
                    connectBtn.style.display = '';
                    disconnectBtn.style.display = 'none';
                }
            } catch (_) {
                statusText.textContent = 'Disconnected';
                connectBtn.style.display = '';
                disconnectBtn.style.display = 'none';
            }
        })();
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
            this.techniqueDropdown.classList.add('open');
        });
        
        closeBtnX.addEventListener('click', (evt) => {
            // Prevent this click from bubbling to document listener
            evt.stopPropagation();
            document.body.removeChild(modalOverlay);
            // Keep dropdown open after closing modal
            this.techniqueDropdown.classList.add('open');
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
                this.techniqueDropdown.classList.add('open');
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
        this.techniqueDropdown.classList.add('open');
        
        // Add real-time validation
        this.setupCustomTimerValidation();
    }

    hideCustomTimerModal() {
        this.customTimerModal.style.display = 'none';
        // Keep dropdown open
        this.techniqueDropdown.classList.add('open');
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
                const requiresAccount = techniqueItem.dataset.requiresAccount === 'true';
                if (requiresAccount && !this.isAuthenticated) {
                    this.loadDefaultTechnique();
                } else {
                    this.selectTechnique(techniqueItem);
                }
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

    pauseSpotify() {
        // Implement logic to pause Spotify playback
        console.log('Spotify paused');
    }

    playSpotifyUri(uri) {
        // Implement logic to play a specific Spotify URI
        console.log('Playing Spotify URI:', uri);
    }

}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});