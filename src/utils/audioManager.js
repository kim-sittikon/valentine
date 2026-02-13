/**
 * AudioManager — all sounds synthesized, no external files.
 * Includes AnalyserNode for audio-reactive visuals (Section 21A).
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.frequencyData = null;
        this.layers = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;

        // AnalyserNode for reactive visuals
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.initialized = true;
    }

    getAudioData() {
        if (!this.analyser) return { bass: 0, mid: 0, high: 0, overall: 0 };

        this.analyser.getByteFrequencyData(this.frequencyData);
        const bins = this.frequencyData;
        const binCount = bins.length;

        let bass = 0, mid = 0, high = 0;
        const bassEnd = Math.floor(binCount * 0.1);
        const midEnd = Math.floor(binCount * 0.5);

        for (let i = 0; i < bassEnd; i++) bass += bins[i];
        for (let i = bassEnd; i < midEnd; i++) mid += bins[i];
        for (let i = midEnd; i < binCount; i++) high += bins[i];

        bass /= Math.max(bassEnd, 1) * 255;
        mid /= Math.max(midEnd - bassEnd, 1) * 255;
        high /= Math.max(binCount - midEnd, 1) * 255;

        const overall = bass * 0.5 + mid * 0.3 + high * 0.2;
        return { bass, mid, high, overall };
    }

    // Low ambient drone (Scene 1-2)
    startDrone() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 55;
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        this.layers.drone = { osc, gain };
    }

    // Sparkle sounds (Scene 2)
    playSparkle() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 2000 + Math.random() * 3000;
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.random() * 2 - 1;
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    // Wind whoosh (Scene 3)
    playWhoosh() {
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.5);
        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }

    // Bass impact (Scene 4)
    playImpact() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 40;
        gain.gain.value = 0.4;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }

    // Heartbeat (Scene 5) — two thuds
    startHeartbeat() {
        const beat = () => {
            const thud = (delay) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.value = 50;
                gain.gain.value = 0;
                gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.15);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(this.ctx.currentTime + delay);
                osc.stop(this.ctx.currentTime + delay + 0.15);
            };
            thud(0);
            thud(0.15);
        };
        this.layers.heartbeatInterval = setInterval(beat, 850);
    }

    stopHeartbeat() {
        if (this.layers.heartbeatInterval) {
            clearInterval(this.layers.heartbeatInterval);
        }
    }

    setMasterVolume(v) {
        if (this.masterGain) this.masterGain.gain.value = v;
    }

    dispose() {
        this.stopHeartbeat();
        if (this.layers.drone) {
            try { this.layers.drone.osc.stop(); } catch (e) { /* already stopped */ }
        }
        if (this.ctx) this.ctx.close();
    }
}
