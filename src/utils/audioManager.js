/**
 * AudioManager — Simple MP3 playback + AnalyserNode for audio-reactive visuals
 *
 * Drop your music file in public/music/bgm.mp3
 * The audio plays on loop, with AnalyserNode feeding frequency data to shaders.
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.audio = null;       // HTML5 Audio element
        this.source = null;      // MediaElementSourceNode
        this.analyser = null;
        this.frequencyData = null;
        this.initialized = false;
        this.isPlaying = false;

        // ─── Envelope state (for smooth audio-reactive visuals) ───
        this.fastEnvelope = { bass: 0, mid: 0, high: 0 };
        this.slowEnvelope = { bass: 0, mid: 0, high: 0 };

        // ─── Beat detection ───
        this.beatLocked = false;
        this.beatTime = 0;
        this.beatThreshold = 0.35;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Create AudioContext
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Resume if suspended (Chrome policy)
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }

            // Create HTML5 Audio element — most reliable audio playback
            this.audio = new Audio();
            this.audio.crossOrigin = 'anonymous';
            this.audio.loop = true;
            this.audio.volume = 0.6;
            this.audio.src = '/music/bgm.mp3';

            // Wait for audio to be loadable
            await new Promise((resolve, reject) => {
                this.audio.addEventListener('canplaythrough', resolve, { once: true });
                this.audio.addEventListener('error', (e) => {
                    console.warn('[Galaxy] ⚠️ BGM file not found at /music/bgm.mp3 — continuing without music');
                    resolve(); // don't block init
                }, { once: true });
                this.audio.load();
            });

            // Connect to Web Audio API for analysis (visual effects)
            this.source = this.ctx.createMediaElementSource(this.audio);

            // AnalyserNode for frequency data
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

            // Wire: source → analyser → speakers
            this.source.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);

            this.initialized = true;
            console.log('[Galaxy] 🎵 AudioManager initialized — ctx state:', this.ctx.state);
        } catch (err) {
            console.error('[Galaxy] ❌ AudioManager init failed:', err);
        }
    }

    // ═══════════════════════════════════════════════
    // Playback controls
    // ═══════════════════════════════════════════════

    async play() {
        if (!this.audio || !this.initialized) return;
        try {
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            await this.audio.play();
            this.isPlaying = true;
            console.log('[Galaxy] ▶️ Music playing');
        } catch (err) {
            console.warn('[Galaxy] ⚠️ Playback failed:', err.message);
        }
    }

    pause() {
        if (!this.audio) return;
        this.audio.pause();
        this.isPlaying = false;
        console.log('[Galaxy] ⏸️ Music paused');
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    setVolume(v) {
        if (this.audio) this.audio.volume = Math.max(0, Math.min(1, v));
    }

    // ═══════════════════════════════════════════════
    // Audio data for visual coupling (same API as before)
    // ═══════════════════════════════════════════════

    getAudioData() {
        if (!this.analyser || !this.isPlaying) {
            return { bass: 0, mid: 0, high: 0, overall: 0, fast: 0, slow: 0, punch: 0, beatPhase: 0 };
        }

        this.analyser.getByteFrequencyData(this.frequencyData);
        const bins = this.frequencyData;
        const binCount = bins.length;

        // Split into 3 bands
        let rawBass = 0, rawMid = 0, rawHigh = 0;
        const bassEnd = Math.floor(binCount * 0.1);
        const midEnd = Math.floor(binCount * 0.5);

        for (let i = 0; i < bassEnd; i++) rawBass += bins[i];
        for (let i = bassEnd; i < midEnd; i++) rawMid += bins[i];
        for (let i = midEnd; i < binCount; i++) rawHigh += bins[i];

        rawBass /= Math.max(bassEnd, 1) * 255;
        rawMid /= Math.max(midEnd - bassEnd, 1) * 255;
        rawHigh /= Math.max(binCount - midEnd, 1) * 255;

        // Dual-layer envelope smoothing
        const fe = this.fastEnvelope;
        const se = this.slowEnvelope;

        fe.bass += (rawBass - fe.bass) * 0.2;
        fe.mid += (rawMid - fe.mid) * 0.2;
        fe.high += (rawHigh - fe.high) * 0.2;

        se.bass += (rawBass - se.bass) * 0.05;
        se.mid += (rawMid - se.mid) * 0.05;
        se.high += (rawHigh - se.high) * 0.05;

        const punch = Math.max(0, fe.bass - se.bass);
        this._detectBeat(fe.bass);
        const beatPhase = this._getBeatPhase();
        const overall = fe.bass * 0.5 + fe.mid * 0.3 + fe.high * 0.2;

        return { bass: rawBass, mid: rawMid, high: rawHigh, overall, fast: fe.bass, slow: se.bass, punch, beatPhase };
    }

    _detectBeat(fastBass) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (fastBass > this.beatThreshold && !this.beatLocked) {
            this.beatTime = now;
            this.beatLocked = true;
        }
        if (fastBass < this.beatThreshold * 0.6) {
            this.beatLocked = false;
        }
    }

    _getBeatPhase() {
        if (!this.ctx || this.beatTime === 0) return 0;
        return Math.exp(-(this.ctx.currentTime - this.beatTime) * 5.0);
    }

    // ═══════════════════════════════════════════════
    // Unused methods (keep API compatible)
    // ═══════════════════════════════════════════════

    crossfadeToScene() { }
    setWarpFilter() { }
    setReverbWet() { }
    setSpatialPan() { }
    playSparkle() { }
    startHeartbeat() { }
    stopHeartbeat() { }
    setMasterVolume(v) { this.setVolume(v); }

    dispose() {
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        if (this.ctx) this.ctx.close();
    }
}
