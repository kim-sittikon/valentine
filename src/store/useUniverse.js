import { create } from 'zustand';

const useUniverse = create((set, get) => ({
    // ─── Scene State ───
    currentScene: 'void',

    // ─── Animation Progress ───
    scrollProgress: 0,
    morphProgress: 0,
    warpStretch: 0,
    heartBeat: 0,

    // ─── Morph Phases (Section 21C) ───
    morphPhase: 'image',
    morphTargets: {
        image: null,
        heart: null,
        qr: null,
    },

    // ─── Interaction ───
    mouseInteraction: false,
    mousePos: { x: 0, y: 0 },
    shockwave: null,

    // ─── System ───
    audioEnabled: false,
    debugMode: false,
    quality: 'high',
    fps: 60,

    // ─── Color ───
    colorPhase: 0,

    // ─── Actions ───
    setScrollProgress: (p) => {
        const scene =
            p < 0.10 ? 'void' :
                p < 0.20 ? 'birth' :
                    p < 0.45 ? 'memory' :
                        p < 0.55 ? 'chaos' :
                            p < 0.75 ? 'gravity' : 'love';

        set({
            scrollProgress: p,
            currentScene: scene,
            mouseInteraction: scene === 'chaos',
            colorPhase: p * 5,
        });
    },

    setMorphProgress: (v) => set({ morphProgress: v }),
    setWarpStretch: (v) => set({ warpStretch: v }),
    setHeartBeat: (v) => set({ heartBeat: v }),
    setMousePos: (pos) => set({ mousePos: pos }),
    setMorphPhase: (phase) => set({ morphPhase: phase }),
    setMorphTargets: (targets) => set({ morphTargets: targets }),

    // Shockwave (Section 19B)
    triggerShockwave: (origin, strength = 1.0) => set({
        shockwave: { origin, time: 0, strength },
    }),
    advanceShockwave: (delta) => {
        const sw = get().shockwave;
        if (!sw) return;
        const newTime = sw.time + delta;
        if (newTime > 2.0) {
            set({ shockwave: null });
        } else {
            set({ shockwave: { ...sw, time: newTime } });
        }
    },
    clearShockwave: () => set({ shockwave: null }),

    toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
    toggleDebug: () => set((s) => ({ debugMode: !s.debugMode })),
    setQuality: (q) => set({ quality: q }),
    setFps: (f) => set({ fps: f }),
}));

export default useUniverse;
