// Audio Manager for Fortune Trader
// Handles all game sound effects

const AudioManager = {
    // Audio elements cache
    sounds: {},
    
    // Volume settings
    masterVolume: 0.8,
    sfxVolume: 1.0,
    
    // Sound enabled flag
    enabled: true,
    lastClickTimestamp: 0,
    
    // Sound file paths
    soundPaths: {
        click: 'audio/click.ogg',
        cookieDropped: 'audio/cookieDropped.ogg',
        cookieOpened: 'audio/cookieOpened.ogg',
        cookieAnimation0: 'audio/cookie_animation_0.wav',
        cookieAnimation1: 'audio/cookie_animation_1.wav',
        cookieAnimation2: 'audio/cookie_animation_2.wav',
        cookieAnimation3: 'audio/cookie_animation_3.wav',
        cookieAnimation4: 'audio/cookie_animation_4.wav',
        cookieAnimation5: 'audio/cookie_animation_5.wav',
        cookiePurchase: 'audio/cookie_purchase.wav',
        error: 'audio/error.ogg',
        cantPlaceBetNow: 'audio/cantplacebeetnow.wav',
        marginBetPlaced: 'audio/marginBetPlaced.wav',
        stockBought: 'audio/stock_bought.wav',
        betPlaced: 'audio/short-long or chart bet_placed.wav',
        openApp: 'audio/openApp.ogg',
        openTrader: 'audio/openTrader.ogg',
        prophecyDecoded: 'audio/prophecyDecoded.ogg',
        tickOfChart: 'audio/tickOfChart.ogg',
        successfulDeal: 'audio/succesfullDeal.wav',
        successfulDealMaxCombo: 'audio/succesfullDealMaxCombo.wav',
        upgradePurchased: 'audio/upgradePurchused.ogg'
    },
    
    // Initialize audio system
    init() {
        // Preload all sounds
        Object.entries(this.soundPaths).forEach(([name, path]) => {
            this.sounds[name] = new Audio(path);
            this.sounds[name].preload = 'auto';
            // Set initial volume
            this.sounds[name].volume = this.masterVolume * this.sfxVolume;
        });
        
        // Load settings from localStorage
        this.loadSettings();
        
        console.log('Audio Manager initialized');
    },
    
    // Play a sound effect
    play(soundName, volumeMultiplier = 1.0) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }
        
        // Clone the audio for overlapping plays
        const audioClone = sound.cloneNode();
        audioClone.volume = this.masterVolume * this.sfxVolume * volumeMultiplier;
        
        // Play and clean up after
        audioClone.play().catch(err => {
            // Ignore autoplay errors (user interaction required first)
            if (err.name !== 'NotAllowedError') {
                console.warn(`Failed to play sound "${soundName}":`, err);
            }
        });
    },
    
    // Play a sound by reusing the same audio element (for frequent sounds)
    playReuse(soundName, volumeMultiplier = 1.0) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }
        
        // Reset and replay the same audio element
        sound.volume = this.masterVolume * this.sfxVolume * volumeMultiplier;
        sound.currentTime = 0;
        
        sound.play().catch(err => {
            if (err.name !== 'NotAllowedError') {
                console.warn(`Failed to play sound "${soundName}":`, err);
            }
        });
    },
    
    // Play click sound (uses reuse for frequent plays during typing)
    playClick() {
        const now = Date.now();
        if (now - this.lastClickTimestamp < 50) {
            return;
        }
        this.lastClickTimestamp = now;
        this.playReuse('click', 1.0);
    },
    
    // Play cookie dropped sound (when dragged to drop zone)
    playCookieDropped() {
        this.play('cookieDropped', 0.8);
    },
    
    // Play cookie opened/cracked sound
    playCookieOpened() {
        this.play('cookieOpened', 1.0);
    },
    
    // Play error sound
    playError(volumeMultiplier = 0.6) {
        this.play('error', volumeMultiplier);
    },

    // Play "can't place bet now" sound (when bet placement is blocked)
    playCantPlaceBetNow(volumeMultiplier = 0.6) {
        this.play('cantPlaceBetNow', volumeMultiplier);
    },

    // Play margin bet placed sound
    playMarginBetPlaced(volumeMultiplier = 1.0) {
        this.play('marginBetPlaced', volumeMultiplier);
    },

    // Play stock bought sound
    playStockBought(volumeMultiplier = 1.0) {
        this.play('stockBought', volumeMultiplier);
    },

    // Play long/short or chart bet placed sound
    playBetPlaced(volumeMultiplier = 1.0) {
        this.play('betPlaced', volumeMultiplier);
    },
    
    // Play app open sound (generic)
    playOpenApp() {
        this.play('openApp', 0.6);
    },
    
    // Play trader app open sound (special)
    playOpenTrader() {
        this.play('openTrader', 0.7);
    },
    
    // Play prophecy decoded sound
    playProphecyDecoded() {
        this.play('prophecyDecoded', 0.8);
    },
    
    // Play chart tick sound (subtle, uses reuse for frequent plays)
    playTickOfChart() {
        this.playReuse('tickOfChart', 0.5);
    },
    
    // Play successful deal sound (winning bet or profitable sale)
    playSuccessfulDeal(volumeMultiplier = 1.0) {
        this.play('successfulDeal', volumeMultiplier);
    },
    
    // Play successful deal max combo sound (when player wins at max combo)
    playSuccessfulDealMaxCombo(volumeMultiplier = 1.0) {
        this.play('successfulDealMaxCombo', volumeMultiplier);
    },
    
    // Play upgrade purchased sound
    playUpgradePurchased(volumeMultiplier = 1.0) {
        this.play('upgradePurchased', volumeMultiplier);
    },
    
    // Play cookie purchase sound (when buying a cookie)
    playCookiePurchase(volumeMultiplier = 1.0) {
        this.play('cookiePurchase', volumeMultiplier);
    },
    
    // Play cookie animation sound for a specific frame (0-5)
    playCookieAnimation(frame, volumeMultiplier = 1.0) {
        if (frame < 0 || frame > 5) {
            console.warn(`Invalid cookie animation frame: ${frame}`);
            return;
        }
        const soundName = `cookieAnimation${frame}`;
        this.play(soundName, volumeMultiplier);
    },
    
    // Set master volume (0.0 to 1.0)
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    },
    
    // Set SFX volume (0.0 to 1.0)
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    },
    
    // Toggle sound on/off
    toggleSound() {
        this.enabled = !this.enabled;
        this.saveSettings();
        return this.enabled;
    },
    
    // Enable/disable sound
    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
    },
    
    // Save settings to localStorage
    saveSettings() {
        try {
            const settings = {
                masterVolume: this.masterVolume,
                sfxVolume: this.sfxVolume,
                enabled: this.enabled
            };
            localStorage.setItem('fortuneTrader_audioSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save audio settings:', e);
        }
    },
    
    // Load settings from localStorage
    loadSettings() {
        try {
            const saved = localStorage.getItem('fortuneTrader_audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.masterVolume = settings.masterVolume ?? 0.8;
                this.sfxVolume = settings.sfxVolume ?? 1.0;
                this.enabled = settings.enabled ?? true;
            }
        } catch (e) {
            console.warn('Failed to load audio settings:', e);
        }
    }
};

// Initialize audio when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AudioManager.init());
} else {
    AudioManager.init();
}
