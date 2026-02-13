import React from 'react';
import useUniverse from '../store/useUniverse';

/**
 * WelcomeOverlay — Two-phase cinematic intro.
 * 
 * Phase 1 (scroll 0–5%): Rocket ship + "ขอต้อนรับสู่การเดินทางครั้งนี้"
 * Phase 2 (scroll 4–10%): "ดอกไม้จากจักรวาล... แด่คนพิเศษ" (with proposal silhouette)
 */

// Shooting stars / travel streaks
const STREAKS = Array.from({ length: 12 }, (_, i) => ({
    left: `${5 + (i * 8.3) % 90}%`,
    top: `${3 + (i * 7.1) % 85}%`,
    delay: `${(i * 0.7) % 5}s`,
    duration: `${2.5 + (i * 0.6) % 3}s`,
    width: `${20 + (i * 7) % 40}px`,
    angle: -25 + (i * 5) % 30,
}));

// Exhaust particles behind rocket
const EXHAUST = Array.from({ length: 8 }, (_, i) => ({
    delay: `${i * 0.2}s`,
    size: `${3 + (i % 3) * 2}px`,
    offsetX: -4 + (i % 5) * 2,
}));

export default function WelcomeOverlay() {
    const scrollProgress = useUniverse((s) => s.scrollProgress);

    if (scrollProgress > 0.11) return null;

    // Phase 1: Welcome (0–5%) — full opacity then fade out
    const phase1 = scrollProgress < 0.04
        ? 1
        : Math.max(0, 1 - (scrollProgress - 0.04) / 0.02);

    // Phase 2: Silhouette text (4–10%)
    const phase2 = scrollProgress < 0.04
        ? 0
        : scrollProgress < 0.06
            ? (scrollProgress - 0.04) / 0.02
            : scrollProgress < 0.09
                ? 1
                : Math.max(0, 1 - (scrollProgress - 0.09) / 0.02);

    return (
        <div className="welcome-overlay">
            {/* Shooting star streaks */}
            <div className="welcome-streaks" aria-hidden="true">
                {STREAKS.map((s, i) => (
                    <span
                        key={i}
                        className="welcome-streak"
                        style={{
                            left: s.left,
                            top: s.top,
                            width: s.width,
                            animationDelay: s.delay,
                            animationDuration: s.duration,
                            transform: `rotate(${s.angle}deg)`,
                        }}
                    />
                ))}
            </div>

            {/* ═══ Phase 1: Rocket + Journey text ═══ */}
            <div
                className="welcome-phase1"
                style={{ opacity: phase1, pointerEvents: 'none' }}
            >
                {/* CSS Rocket Ship */}
                <div className="rocket-container" aria-hidden="true">
                    <div className="rocket-ship">
                        <div className="rocket-nose" />
                        <div className="rocket-body">
                            <div className="rocket-window" />
                        </div>
                        <div className="rocket-fins">
                            <div className="rocket-fin-left" />
                            <div className="rocket-fin-right" />
                        </div>
                        <div className="rocket-flame">
                            <div className="flame-inner" />
                            <div className="flame-outer" />
                        </div>
                    </div>
                    {/* Orbit ring */}
                    <div className="rocket-orbit" />
                    {/* Exhaust trail */}
                    <div className="rocket-exhaust">
                        {EXHAUST.map((e, i) => (
                            <span
                                key={i}
                                className="exhaust-dot"
                                style={{
                                    animationDelay: e.delay,
                                    width: e.size,
                                    height: e.size,
                                    left: `calc(50% + ${e.offsetX}px)`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Journey text */}
                <div className="welcome-hero">
                    <p className="welcome-line-1">ขอต้อนรับสู่การเดินทางครั้งนี้</p>
                    <p className="welcome-line-sub">จักรวาลแห่งความทรงจำของเรา กำลังจะเริ่มต้น...</p>
                </div>
            </div>

            {/* ═══ Phase 2: Silhouette caption ═══ */}
            <div
                className="welcome-phase2"
                style={{ opacity: phase2, pointerEvents: 'none' }}
            >
                <p className="silhouette-line-1">ดอกไม้จากจักรวาล...</p>
                <p className="silhouette-line-2">แด่คนพิเศษ</p>
            </div>

            {/* Scroll cue */}
            {phase1 > 0.3 && (
                <div className="welcome-scroll-cue" style={{ opacity: phase1 }}>
                    <span className="welcome-cue-line" />
                    <span className="welcome-cue-text">ค่อยๆ เลื่อนลง เพื่อเริ่มการเดินทาง</span>
                </div>
            )}
        </div>
    );
}
