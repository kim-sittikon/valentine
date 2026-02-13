import { create } from 'zustand';
import { SCENES, getSceneFromProgress, getLocalProgress } from '../config/sceneConfig';

const useUniverse = create((set, get) => ({
    // ─── Scene State ───
    currentScene: 'void',
    prevScene: 'void',
    localProgress: 0,
    sceneEnergy: 0.2,
    sceneIndex: 0,

    // ─── Animation Progress ───
    scrollProgress: 0,
    scrollVelocity: 0,
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
        const prev = get().currentScene;
        const { scene, index } = getSceneFromProgress(p, prev);
        const local = getLocalProgress(p, scene);

        set({
            scrollProgress: p,
            currentScene: scene.name,
            prevScene: prev,
            localProgress: local,
            sceneEnergy: scene.energy,
            sceneIndex: index,
            mouseInteraction: scene.name === 'chaos',
            colorPhase: p * 5,
        });
    },

    setScrollVelocity: (v) => set({ scrollVelocity: v }),
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
