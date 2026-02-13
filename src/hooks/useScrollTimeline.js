import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useUniverse from '../store/useUniverse';
import { SCENES, getSceneByName } from '../config/sceneConfig';

gsap.registerPlugin(ScrollTrigger);

/**
 * Clamp value between min and max.
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Scene transition event handlers.
 * Logic lives here (not in store) — will expand for Phase 6 audio.
 */
function handleSceneTransition(fromScene, toScene, state) {
    const toConfig = getSceneByName(toScene);
    const event = toConfig?.event || 'unknown';

    // ─── Enriched transition log ───
    console.log(
        `[Galaxy] 🎬 Scene: ${fromScene} → ${toScene}` +
        ` (event: ${event})` +
        ` | local: ${state.localProgress.toFixed(2)}` +
        ` | vel: ${state.scrollVelocity.toFixed(3)}` +
        ` | energy: ${toConfig?.energy ?? '?'}`
    );

    // ─── Scene-specific one-shot events ───
    switch (event) {
        case 'warp_stretch':
            // Gravity scene — prep for shockwave
            console.log('[Galaxy] 🚀 Warp stretch activated');
            break;

        case 'heart_morph':
            // ★ Trigger shockwave at gravity→love boundary
            import('three').then(({ Vector3 }) => {
                useUniverse.getState().triggerShockwave(new Vector3(0, 0, 0), 1.0);
                console.log('[Galaxy] 💥 Shockwave triggered!');
            });
            break;

        case 'particles_fadein':
            // Will trigger drone audio fade-in (Phase 6)
            break;

        case 'mouse_interaction':
            // Chaos scene — mouse interaction auto-enabled via store
            console.log('[Galaxy] 🌪 Mouse interaction active');
            break;

        default:
            break;
    }
}

export default function useScrollTimeline() {
    // ─── Refs for velocity calculation (no re-renders) ───
    const prevProgressRef = useRef(0);
    const prevTimeRef = useRef(performance.now());
    const prevSceneRef = useRef('void');

    useEffect(() => {
        // ─── Main scroll → progress + velocity mapping ───
        ScrollTrigger.create({
            trigger: '#scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            onUpdate: (self) => {
                const now = performance.now();
                const progress = self.progress;
                const deltaTime = (now - prevTimeRef.current) / 1000; // seconds

                // ─── Normalized velocity (÷deltaTime + clamp ±2) ───
                let velocity = 0;
                if (deltaTime > 0.001) { // Guard against division by near-zero
                    velocity = (progress - prevProgressRef.current) / deltaTime;
                    velocity = clamp(velocity, -2, 2);
                }

                // Update refs (before state, so no stale reads)
                prevProgressRef.current = progress;
                prevTimeRef.current = now;

                // ─── Push to Zustand ───
                const store = useUniverse.getState();
                store.setScrollProgress(progress);
                store.setScrollVelocity(velocity);

                // ─── One-shot scene transition (ref-based, no double fire) ───
                const currentScene = useUniverse.getState().currentScene;
                if (currentScene !== prevSceneRef.current) {
                    handleSceneTransition(
                        prevSceneRef.current,
                        currentScene,
                        useUniverse.getState()
                    );
                    prevSceneRef.current = currentScene;
                }
            },
        });

        // ─── Per-scene GSAP timelines ───
        const memoryConfig = getSceneByName('memory');
        const gravityConfig = getSceneByName('gravity');
        const loveConfig = getSceneByName('love');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-container',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
            },
        });

        // Phase A: stars → photo (memory scene: 20% → 45%)
        const morphA = { phase: 0 };
        tl.to(morphA, {
            phase: 1,
            duration: 0.25,
            ease: memoryConfig?.easing || 'power2.inOut',
            onUpdate: () => {
                useUniverse.getState().setMorphPhase(morphA.phase);
            },
        }, memoryConfig?.range[0] || 0.2);

        // Gravity: Warp stretch (55% → 75%)
        const warpTarget = { warpStretch: 0 };
        tl.to(warpTarget, {
            warpStretch: 3,
            duration: 0.2,
            ease: gravityConfig?.easing || 'power3.in',
            onUpdate: () => {
                useUniverse.getState().setWarpStretch(warpTarget.warpStretch);
            },
        }, gravityConfig?.range[0] || 0.55);

        // Phase B: photo → heart (love scene: 75% → 100%)
        const morphB = { phase: 1 };
        tl.to(morphB, {
            phase: 2,
            duration: 0.25,
            ease: loveConfig?.easing || 'power2.out',
            onUpdate: () => {
                useUniverse.getState().setMorphPhase(morphB.phase);
            },
        }, loveConfig?.range[0] || 0.75);

        return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    }, []);
}
