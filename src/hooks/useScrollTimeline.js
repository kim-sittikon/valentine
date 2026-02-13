import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useUniverse from '../store/useUniverse';

gsap.registerPlugin(ScrollTrigger);

export default function useScrollTimeline() {
    useEffect(() => {
        // Main scroll → progress mapping
        ScrollTrigger.create({
            trigger: '#scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            onUpdate: (self) => {
                useUniverse.getState().setScrollProgress(self.progress);
            },
        });

        // Per-scene GSAP timelines for morph, warp, etc.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-container',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
            },
        });

        // Scene 2: Morph progress (20% → 45%)
        const morphTarget = { morphProgress: 0 };
        tl.to(morphTarget, {
            morphProgress: 1,
            duration: 0.25,
            ease: 'power2.inOut',
            onUpdate: () => {
                useUniverse.getState().setMorphProgress(morphTarget.morphProgress);
            },
        }, 0.2);

        // Scene 4: Warp stretch (55% → 75%)
        const warpTarget = { warpStretch: 0 };
        tl.to(warpTarget, {
            warpStretch: 3,
            duration: 0.2,
            ease: 'power3.in',
            onUpdate: () => {
                useUniverse.getState().setWarpStretch(warpTarget.warpStretch);
            },
        }, 0.55);

        return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    }, []);
}
