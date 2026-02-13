import React, { useRef, useEffect, useState } from 'react';
import useUniverse from '../store/useUniverse';

/**
 * BackgroundVideo — Fullscreen cinematic video background.
 *
 * Instead of a 3D hologram inside the heart, the video plays as a
 * dreamy, translucent fullscreen background that fades in during
 * the Love scene climax (scroll 85%→100%).
 *
 * Design:
 *  - Positioned BEHIND the canvas (z-index: 0)
 *  - Very low opacity + blend with dark background = cinematic
 *  - Soft vignette overlay darkens edges
 *  - Purple/pink color wash for cohesion with theme
 *  - Video only loads & plays near activation = performance
 */

export default function BackgroundVideo() {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const rafRef = useRef(null);

    const PRELOAD_AT = 0.80;
    const PLAY_AT = 0.83;
    const VISIBLE_AT = 0.85;

    // Create & manage video lifecycle
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.addEventListener('canplaythrough', () => setIsLoaded(true));

        return () => {
            video.pause();
        };
    }, []);

    // Scroll-driven opacity & playback control
    useEffect(() => {
        const tick = () => {
            const scrollProgress = useUniverse.getState().scrollProgress;
            const video = videoRef.current;
            const container = containerRef.current;

            if (!video || !container) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            // ── Preload ──
            if (scrollProgress >= PRELOAD_AT && video.preload === 'metadata') {
                video.preload = 'auto';
                video.load();
            }

            // ── Play / Pause ──
            if (scrollProgress >= PLAY_AT && isLoaded) {
                if (video.paused) {
                    video.play().catch(() => { });
                }
            } else {
                if (!video.paused) {
                    video.pause();
                }
            }

            // ── Opacity (fade in at 85%, fade out at 90%→94%) ──
            let opacity = 0;
            if (scrollProgress >= VISIBLE_AT && scrollProgress < 0.90) {
                // Fade in: 85% → 90%
                const t = Math.min(1, (scrollProgress - VISIBLE_AT) / 0.05);
                opacity = t * t * (3 - 2 * t) * 0.70;
            } else if (scrollProgress >= 0.90 && scrollProgress < 0.94) {
                // Fade out: 90% → 94%
                const t = 1 - Math.min(1, (scrollProgress - 0.90) / 0.04);
                opacity = t * t * (3 - 2 * t) * 0.70;
            }

            container.style.opacity = opacity;

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isLoaded]);

    return (
        <div ref={containerRef} className="bg-video" style={{ opacity: 0 }}>
            <video
                ref={videoRef}
                className="bg-video__player"
                src="/video/moment.mp4"
                muted
                loop
                playsInline
                preload="metadata"
            />
            {/* Vignette overlay — darkens edges for cinematic feel */}
            <div className="bg-video__vignette" />
            {/* Color wash — purple/pink tint to match theme */}
            <div className="bg-video__color-wash" />
        </div>
    );
}
