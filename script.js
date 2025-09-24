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
        this.interval = null;
        
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
        
        // DOM elements
        this.timeElement = document.getElementById('time');
        this.modeElement = document.getElementById('mode');
        this.sessionInfoElement = document.getElementById('sessionInfo');
        this.startPauseBtn = document.getElementById('startPause');
        this.prevSectionBtn = document.getElementById('prevSectionBtn');
        this.nextSectionBtn = document.getElementById('nextSectionBtn');
        this.progressSegments = document.querySelectorAll('.progress-segment');
        this.progressIndicator = document.querySelector('.progress-indicator');
        this.progressOverlays = document.querySelectorAll('.progress-overlay');
        this.techniqueTitle = document.getElementById('techniqueTitle');
        this.techniqueDropdown = document.getElementById('techniqueDropdown');
        this.dropdownMenu = document.getElementById('dropdownMenu');
        this.dropdownItems = document.querySelectorAll('.dropdown-item');
        this.backgroundAudio = document.getElementById('backgroundAudio');
        
        // Auth elements
        this.authContainer = document.getElementById('authContainer');
        this.loginButton = document.getElementById('loginButton');
        this.signupButton = document.getElementById('signupButton');
        // User profile elements (shown when authenticated)
        this.userProfileContainer = document.getElementById('userProfileContainer');
        this.userProfileButton = document.getElementById('userProfileButton');
        this.userProfileDropdown = document.getElementById('userProfileDropdown');
        this.userDropdownMenu = document.getElementById('userDropdownMenu');
        this.userAvatar = document.getElementById('userAvatar');
        this.logoutButton = document.getElementById('logoutButton');
        
        // Logout modal elements
        this.logoutModalOverlay = document.getElementById('logoutModalOverlay');
        this.logoutModalMessage = document.getElementById('logoutModalMessage');
        this.confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        this.cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        
        // Auth state
        this.isAuthenticated = false;
        this.user = null;
        
        // Audio state
        this.currentAudio = null;
        this.audioContext = null;
        this.cassetteSounds = null;
        
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
                        // Hide the development banner
                        '::before': {
                            content: 'none'
                        }
                    }
                },
                // Additional configuration to ensure production mode
                isSatellite: false,
                domain: window.location.hostname,
                // Vercel-specific configuration
                isProduction: true,
                environment: 'production'
            });
            
            // Hydrate initial auth state
            this.isAuthenticated = !!window.Clerk.user;
            this.user = window.Clerk.user;
            console.log('Initial auth state:', { isAuthenticated: this.isAuthenticated, user: this.user });

            // If coming from a Clerk redirect, remove query params and ensure user state settles
            try {
                const url = new URL(window.location.href);
                if (url.searchParams.has('__clerk_status')) {
                    url.searchParams.delete('__clerk_status');
                    window.history.replaceState({}, '', url.toString());
                }
            } catch (_) {}

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
            
            this.updateAuthState();
        } catch (error) {
            console.error('Clerk initialization failed:', error);
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
        if (this.isAuthenticated && this.user) {
            try { localStorage.setItem('hasAccount', 'true'); } catch (_) {}
            if (this.authContainer) this.authContainer.style.display = 'none';
            if (this.userProfileContainer) this.userProfileContainer.style.display = 'flex';
            this.updateUserProfile();
            console.log('User is authenticated, showing profile avatar');
        } else {
            if (this.authContainer) this.authContainer.style.display = 'flex';
            if (this.userProfileContainer) this.userProfileContainer.style.display = 'none';
            if (this.loginButton) this.loginButton.textContent = 'Login';
            if (this.signupButton) this.signupButton.style.display = 'block';
            console.log('User is not authenticated, showing login/signup buttons');
        }
    }

    updateUserProfile() {
        if (!this.user) return;
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
            
            // Optimistic UI update and redirect sign out
            this.isAuthenticated = false;
            this.user = null;
            this.updateAuthState();
            await window.Clerk.signOut({ redirectUrl: window.location.href });
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
                console.log('Redirecting to sign in...');
                window.Clerk.redirectToSignIn({
                    redirectUrl: window.location.href,
                });
            }
        } catch (error) {
            console.error('Login/logout failed:', error);
        }
    }

    async handleSignup() {
        try {
            const hasAccount = (() => { try { return localStorage.getItem('hasAccount') === 'true'; } catch (_) { return false; }})();
            if (hasAccount) {
                console.log('Known account on this browser. Redirecting to sign in...');
                window.Clerk.redirectToSignIn({ redirectUrl: window.location.href });
            } else {
                console.log('Redirecting to sign up...');
                window.Clerk.redirectToSignUp({ redirectUrl: window.location.href });
            }
        } catch (error) {
            console.error('Sign up failed:', error);
        }
    }


    updateTechniqueTitle() {
        // For now, fixed Pomodoro – could be dynamic later
        if (this.techniqueTitle) {
            this.techniqueTitle.innerHTML = 'Pomodoro<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>';
        }
    }
    
    toggleDropdown() {
        this.techniqueDropdown.classList.toggle('open');
    }
    
    closeDropdown() {
        this.techniqueDropdown.classList.remove('open');
    }
    
    selectTechnique(item) {
        const technique = item.dataset.technique;
        const title = item.querySelector('.item-title').textContent;
        
        // Update the button text
        this.techniqueTitle.innerHTML = `${title}<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
        
        // Close dropdown
        this.closeDropdown();
        
        // Here you could implement different timer configurations based on technique
        this.loadTechnique(technique);
    }
    
    loadTechnique(technique) {
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
                this.workTime = 45 * 60;
                this.shortBreakTime = 15 * 60;
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
        }
        
        // Reset timer with new configuration
        this.pauseTimerSilent();
        this.currentSection = 1;
        this.loadCurrentSection();
        this.updateNavigationButtons();
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
        this.techniqueTitle.addEventListener('click', () => this.toggleDropdown());
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.techniqueDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Handle dropdown item selection
        this.dropdownItems.forEach(item => {
            item.addEventListener('click', () => this.selectTechnique(item));
        });
        
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
        
        // Profile dropdown toggle
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
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.startPauseBtn.textContent = 'Pause';
        this.startPauseBtn.classList.add('running');
        this.playUiSound('play');
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            this.updateSections();
            this.updateSessionInfo();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.startPauseBtn.textContent = 'Start';
        this.startPauseBtn.classList.remove('running');
        
        clearInterval(this.interval);
        this.playUiSound('pause');
        
        // Update title to show paused state
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const modeText = this.isWorkSession ? 'Focus' : (this.isLongBreak ? 'Long Break' : 'Break');
        document.title = `${timeString} - ${modeText} (Paused) | Focus Timer`;
    }
    
    pauseTimerSilent() {
        this.isRunning = false;
        this.startPauseBtn.textContent = 'Start';
        this.startPauseBtn.classList.remove('running');
        
        clearInterval(this.interval);
        // No sound - silent pause
        
        // Update title to show paused state
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const modeText = this.isWorkSession ? 'Focus' : (this.isLongBreak ? 'Long Break' : 'Break');
        document.title = `${timeString} - ${modeText} (Paused) | Focus Timer`;
    }
    
    goToPreviousSection() {
        if (this.currentSection > 1) {
            this.pauseTimerSilent(); // Pause without sound
            this.currentSection--;
            this.loadCurrentSection();
            this.updateNavigationButtons();
        }
    }
    
    goToNextSection() {
        if (this.currentSection < this.cycleSections.length) {
            this.pauseTimerSilent(); // Pause without sound
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
        
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateMode();
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
        this.pauseTimer();
        
        // Play notification sound
        this.playNotification();
        
        // Move to next section in cycle
        this.currentSection++;
        
        // If we've completed all sections, restart the cycle
        if (this.currentSection > this.cycleSections.length) {
            this.currentSection = 1;
        }
        
        // Get current section info
        const currentSectionInfo = this.cycleSections[this.currentSection - 1];
        this.timeLeft = currentSectionInfo.duration;
        
        // Update session type flags
        this.isWorkSession = currentSectionInfo.type === 'work';
        this.isLongBreak = currentSectionInfo.type === 'long-break';
        
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateMode();
        this.updateSessionInfo();
        
        // Auto-start the next session after a short delay
        setTimeout(() => {
            this.startTimer();
        }, 1000);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update main display
        this.timeElement.textContent = timeString;
        
        // Update browser tab title
        const currentSectionInfo = this.cycleSections[this.currentSection - 1];
        const modeText = this.isWorkSession ? 'Focus' : (this.isLongBreak ? 'Long Break' : 'Break');
        document.title = `${timeString} - ${modeText} | Focus Timer`;
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
    
    updateMode() {
        if (this.isWorkSession) {
            this.modeElement.textContent = 'Focus';
            this.modeElement.className = 'mode focus';
            this.progressIndicator.style.stroke = 'url(#liquidGlassOverlay)';
        } else if (this.isLongBreak) {
            this.modeElement.textContent = 'Long Break';
            this.modeElement.className = 'mode long-break';
            this.progressIndicator.style.stroke = 'url(#liquidGlassOverlay)';
        } else {
            this.modeElement.textContent = 'Break';
            this.modeElement.className = 'mode break';
            this.progressIndicator.style.stroke = 'url(#liquidGlassOverlay)';
        }
    }
    
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
        
        // Format as "Session X of Y (Z%)"
        const sessionNumber = this.currentSection;
        const totalSessions = this.cycleSections.length;
        this.sessionInfoElement.textContent = `Session ${sessionNumber} of ${totalSessions} (${progressPercentage}%)`;
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
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});