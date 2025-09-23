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
        this.progressCircle = document.querySelector('.progress-ring-circle');
        this.progressSegments = document.querySelectorAll('.progress-segment');
        this.progressIndicator = document.querySelector('.progress-indicator');
        this.progressOverlays = document.querySelectorAll('.progress-overlay');
        this.techniqueTitle = document.getElementById('techniqueTitle');
        this.techniqueDropdown = document.getElementById('techniqueDropdown');
        this.dropdownMenu = document.getElementById('dropdownMenu');
        this.dropdownItems = document.querySelectorAll('.dropdown-item');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.settingsButton = document.getElementById('settingsButton');
        this.settingsMenu = document.getElementById('settingsMenu');
        this.audioOptions = document.querySelectorAll('.audio-option');
        this.backgroundAudio = document.getElementById('backgroundAudio');
        this.achievementIcon = document.getElementById('achievementIcon');
        this.achievementCounter = document.getElementById('achievementCounter');
        
        // Audio state
        this.currentAudio = null;
        this.audioContext = null;
        this.cassetteSounds = null;
        
        // Achievement state
        this.completedCycles = 0;
        this.totalWorkTime = 0; // Track total work time in seconds
        this.achievementThreshold = 130 * 60; // 130 minutes in seconds (4x25min work + 3x5min break + 1x15min long break)
        
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
        this.loadAchievements();
        this.loadCassetteSounds();
    }

    updateTechniqueTitle() {
        // For now, fixed Pomodoro – could be dynamic later
        if (this.techniqueTitle) {
            this.techniqueTitle.innerHTML = 'Pomodoro<span class="dropdown-arrow">▼</span>';
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
        this.techniqueTitle.innerHTML = `${title}<span class="dropdown-arrow">▼</span>`;
        
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
                this.longBreakTime = 15 * 60; // Corrected to 15 minutes
                break;
            case 'pomodoro-plus':
                this.workTime = 45 * 60;
                this.shortBreakTime = 15 * 60;
                this.longBreakTime = 30 * 60;
                break;
            case 'flowtime':
                // Flowtime doesn't have fixed intervals, but we'll use a default
                this.workTime = 60 * 60; // 1 hour
                this.shortBreakTime = 10 * 60;
                this.longBreakTime = 30 * 60;
                break;
            case 'timeblocking':
                this.workTime = 90 * 60; // 1.5 hours
                this.shortBreakTime = 15 * 60;
                this.longBreakTime = 30 * 60;
                break;
        }
        
        // Reset timer with new configuration
        this.resetTimer();
    }
    
    toggleSettings() {
        this.settingsPanel.classList.toggle('open');
        // Close dropdown if open
        this.closeDropdown();
    }
    
    closeSettings() {
        this.settingsPanel.classList.remove('open');
    }
    
    selectAudio(option) {
        const audioType = option.dataset.audio;
        
        // Remove active class from all options
        this.audioOptions.forEach(opt => opt.classList.remove('active'));
        
        // Add active class to selected option
        option.classList.add('active');
        
        // Stop current audio
        this.stopAudio();
        
        // Start new audio
        this.startAudio(audioType);
        
        // Store preference
        localStorage.setItem('selectedAudio', audioType);
        
        // Close settings
        this.closeSettings();
    }
    
    startAudio(type) {
        if (type === 'none') return;
        
        // Para Lofi, usar solo audio sin video
        if (type === 'lofi') {
            this.startLofiAudio();
            return;
        }
        
        // Para sonidos ambientales, usar archivos de audio
        const audioUrls = {
            // Rain variations
            'rain-light': 'https://www.soundjay.com/misc/sounds/rain-light.mp3',
            'rain-heavy': 'https://www.soundjay.com/misc/sounds/rain-heavy.mp3',
            'rain-thunder': 'https://www.soundjay.com/misc/sounds/rain-thunder.mp3',
            
            // Forest variations
            'forest-birds': 'https://www.soundjay.com/misc/sounds/forest-birds.mp3',
            'forest-wind': 'https://www.soundjay.com/misc/sounds/forest-wind.mp3',
            'forest-night': 'https://www.soundjay.com/misc/sounds/forest-night.mp3',
            
            // Café variations
            'cafe-morning': 'https://www.soundjay.com/misc/sounds/cafe-morning.mp3',
            'cafe-busy': 'https://www.soundjay.com/misc/sounds/cafe-busy.mp3',
            'cafe-cozy': 'https://www.soundjay.com/misc/sounds/cafe-cozy.mp3'
        };
        
        if (audioUrls[type]) {
            this.backgroundAudio.src = audioUrls[type];
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = 0.3;
            this.backgroundAudio.play().catch(e => console.log('Audio play failed:', e));
            this.currentAudio = this.backgroundAudio;
        }
    }
    
    startLofiAudio() {
        // Usar solo audio de lofi sin video
        // Crear un elemento audio para lofi
        const lofiAudio = new Audio();
        lofiAudio.src = 'https://www.youtube.com/watch?v=jfKfPfyJRdk&output=audio'; // Solo audio
        lofiAudio.loop = true;
        lofiAudio.volume = 0.3;
        lofiAudio.play().catch(e => {
            console.log('Lofi audio failed, using fallback');
            // Fallback: usar un archivo de audio lofi local o de otra fuente
            this.backgroundAudio.src = 'https://www.soundjay.com/misc/sounds/lofi-music.mp3';
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = 0.3;
            this.backgroundAudio.play().catch(e => console.log('Fallback audio failed:', e));
            this.currentAudio = this.backgroundAudio;
        });
        this.currentAudio = lofiAudio;
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
    
    loadAudio() {
        const savedAudio = localStorage.getItem('selectedAudio') || 'none';
        const audioOption = document.querySelector(`[data-audio="${savedAudio}"]`);
        if (audioOption) {
            this.selectAudio(audioOption);
        } else {
            // Si no hay audio guardado, seleccionar Silent por defecto
            const silentOption = document.querySelector('[data-audio="none"]');
            if (silentOption) {
                silentOption.classList.add('active');
            }
        }
    }

    // Layout segments proportionally starting from 12 o'clock, with small gaps
    layoutSegments() {
        const CIRCUMFERENCE = 2 * Math.PI * 45; // 283
        // Target visible gap 2px → with round caps and width 4, use GAP ≈ 6
        const GAP = 6;

        // Read minutes from DOM to support easy tweaks
        const minutes = Array.from(this.progressSegments).map(seg => parseInt(seg.dataset.minutes, 10));
        const totalMinutes = minutes.reduce((a, b) => a + b, 0); // should be 130 (25+5+25+5+25+5+25+15)

        // Compute raw lengths proportionally based on actual duration
        const lengths = minutes.map(m => (m / totalMinutes) * CIRCUMFERENCE);

        // Apply gaps: ensure each gap is GAP length, subtract proportionally from each segment
        const totalGaps = GAP * this.progressSegments.length;
        const scale = (CIRCUMFERENCE - totalGaps) / CIRCUMFERENCE;
        const scaledLengths = lengths.map(len => Math.max(6, len * scale)); // min length
        this._segmentMeta = { CIRCUMFERENCE, GAP, scaledLengths };

        // Set dasharray and offsets so the first segment starts at 12 o'clock.
        // Because we rotate the group and indicator -90deg in CSS, here we start at 0.
        let offset = 0;
        this.progressSegments.forEach((seg, idx) => {
            const segLen = scaledLengths[idx];
            seg.setAttribute('stroke-dasharray', `${segLen} ${CIRCUMFERENCE}`);
            seg.setAttribute('stroke-dashoffset', `${-offset}`);
            offset += segLen + GAP;
        });
    }
    
    bindEvents() {
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
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
        
        // Settings panel events
        this.settingsButton.addEventListener('click', () => this.toggleSettings());
        
        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target)) {
                this.closeSettings();
            }
        });
        
        // Handle audio selection
        this.audioOptions.forEach(option => {
            option.addEventListener('click', () => this.selectAudio(option));
        });
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
    
    resetTimer() {
        this.pauseTimerSilent(); // Use silent pause to avoid sound
        this.currentSection = 1;
        this.isWorkSession = true;
        this.isLongBreak = false;
        this.timeLeft = this.workTime;
        this.updateDisplay();
        this.updateProgress();
        this.updateSections();
        this.updateMode();
        this.updateSessionInfo();
        
        // Update title to show reset state
        document.title = `25:00 - Focus | Focus Timer`;
    }
    
    completeSession() {
        this.pauseTimer();
        
        // Track work time for achievements (only count work sessions)
        if (this.isWorkSession) {
            const workDuration = this.cycleSections[this.currentSection - 1].duration;
            this.trackWorkTime(workDuration);
        }
        
        // Play notification sound
        this.playNotification();
        
        // Move to next section in cycle
        this.currentSection++;
        
        // If we've completed all 8 sections, restart the cycle
        if (this.currentSection > 8) {
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
        
        // Calculate progress within current section
        const sectionProgress = (this.timeLeft / totalTime);
        
        // Calculate total progress through the entire 145-minute cycle
        let totalCycleProgress = 0;
        for (let i = 0; i < this.currentSection - 1; i++) {
            totalCycleProgress += this.cycleSections[i].duration;
        }
        totalCycleProgress += (currentSectionInfo.duration - this.timeLeft);
        
        // Convert to percentage of full circle (145 minutes total)
        const fullCycleProgress = (totalCycleProgress / (145 * 60)) * 283; // 2 * π * 45
        
        // Create a segmented progress indicator that respects section boundaries
        this.updateSegmentedProgress(fullCycleProgress);
    }
    
    updateSegmentedProgress(totalProgress) {
        const { CIRCUMFERENCE, GAP, scaledLengths } = this._segmentMeta;
        
        // Update each overlay to match its own segment completion
        let cursor = 0;
        this.progressOverlays.forEach((ol, i) => {
            const segLen = scaledLengths[i];
            let fillLen = 0;
            
            // Check if this segment should be visible
            if (totalProgress > cursor) {
                // This segment has started
                if (totalProgress >= cursor + segLen) {
                    // Segment is fully filled
                    fillLen = segLen;
                } else {
                    // Segment is partially filled - but only show if we're past the gap
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

            cursor += segLen + GAP;
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
        
        const totalCycleTime = 145 * 60; // 145 minutes in seconds
        const progressPercentage = Math.round((totalCycleProgress / totalCycleTime) * 100);
        
        // Format as "Session X of 4 (Y%)"
        const sessionNumber = this.currentSection;
        this.sessionInfoElement.textContent = `Session ${sessionNumber} of 4 (${progressPercentage}%)`;
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
    
    // Achievement System Methods
    loadAchievements() {
        const saved = localStorage.getItem('pomodoroAchievements');
        if (saved) {
            const data = JSON.parse(saved);
            this.completedCycles = data.completedCycles || 0;
            this.totalWorkTime = data.totalWorkTime || 0;
        }
        this.updateAchievementDisplay();
    }
    
    saveAchievements() {
        const data = {
            completedCycles: this.completedCycles,
            totalWorkTime: this.totalWorkTime
        };
        localStorage.setItem('pomodoroAchievements', JSON.stringify(data));
    }
    
    updateAchievementDisplay() {
        if (this.achievementIcon && this.achievementCounter) {
            if (this.completedCycles > 0) {
                this.achievementIcon.classList.add('active');
                this.achievementCounter.textContent = this.completedCycles;
            } else {
                this.achievementIcon.classList.remove('active');
                this.achievementCounter.textContent = '0';
            }
        }
    }
    
    trackWorkTime(seconds) {
        this.totalWorkTime += seconds;
        
        // Check if we've completed a full cycle (130 minutes = 7800 seconds)
        if (this.totalWorkTime >= this.achievementThreshold) {
            this.completedCycles++;
            this.totalWorkTime = 0; // Reset for next cycle
            this.updateAchievementDisplay();
            this.saveAchievements();
            this.playAchievementSound();
        }
    }
    
    playAchievementSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play a pleasant achievement sound
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
            
                oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (_) { /* no-op */ }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});