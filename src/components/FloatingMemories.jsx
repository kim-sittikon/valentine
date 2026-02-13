import React from 'react';
import useUniverse from '../store/useUniverse';

/**
 * Floating Memories — 3D Polaroid photos floating in zero-gravity space.
 *
 * Each polaroid has:
 *  - White frame with CSS 3D depth (pseudo-element sides)
 *  - Continuous gentle rotation (tumbling in space)
 *  - Soft cosmic glow aura
 *  - Parallax drift on scroll
 *  - Dreamy, translucent — like memories in the void
 */

const MEMORIES = [
    {
        src: '/photos/memory1.webp',
        start: 0.16,
        end: 0.29,
        // Position on screen
        left: '6%',
        top: '10%',
        // 3D rotation angles (degrees) — each unique
        baseRotateX: 12,
        baseRotateY: -18,
        baseRotateZ: -6,
        // Orbit speed multipliers (how fast it tumbles)
        orbitSpeedX: 0.7,
        orbitSpeedY: 1.0,
        // Float offset phase
        floatPhase: 0,
        // Drift direction as scroll progresses
        driftX: 40,
        driftY: -30,
    },
    {
        src: '/photos/memory2.webp',
        start: 0.21,
        end: 0.34,
        left: '66%',
        top: '6%',
        baseRotateX: -8,
        baseRotateY: 15,
        baseRotateZ: 4,
        orbitSpeedX: 0.9,
        orbitSpeedY: 0.6,
        floatPhase: 1.5,
        driftX: -35,
        driftY: 20,
    },
    {
        src: '/photos/memory3.webp',
        start: 0.25,
        end: 0.37,
        left: '4%',
        top: '55%',
        baseRotateX: 10,
        baseRotateY: 20,
        baseRotateZ: 8,
        orbitSpeedX: 0.5,
        orbitSpeedY: 0.8,
        floatPhase: 3.0,
        driftX: 30,
        driftY: -25,
    },
    {
        src: '/photos/memory4.webp',
        start: 0.30,
        end: 0.42,
        left: '62%',
        top: '52%',
        baseRotateX: -14,
        baseRotateY: -12,
        baseRotateZ: -5,
        orbitSpeedX: 0.8,
        orbitSpeedY: 1.1,
        floatPhase: 4.5,
        driftX: -25,
        driftY: -20,
    },
];

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function MemoryCard({ memory, scrollProgress, time }) {
    const {
        src, start, end, left, top,
        baseRotateX, baseRotateY, baseRotateZ,
        orbitSpeedX, orbitSpeedY, floatPhase,
        driftX, driftY,
    } = memory;

    const span = end - start;
    const fadeIn = span * 0.30;
    const fadeOut = span * 0.30;

    // Calculate opacity with smooth easing
    let opacity = 0;
    if (scrollProgress >= start && scrollProgress <= end) {
        if (scrollProgress < start + fadeIn) {
            opacity = easeInOutCubic((scrollProgress - start) / fadeIn);
        } else if (scrollProgress > end - fadeOut) {
            opacity = easeInOutCubic((end - scrollProgress) / fadeOut);
        } else {
            opacity = 1;
        }
    }

    // Dreamy max opacity
    opacity *= 0.88;
    if (opacity <= 0.01) return null;

    // Scroll-based progress within this card's window
    const windowT = (scrollProgress - start) / span;

    // ─── 3D Rotation: continuous gentle tumble ───
    const t = time * 0.001; // seconds
    const rotX = baseRotateX + Math.sin(t * orbitSpeedX + floatPhase) * 8;
    const rotY = baseRotateY + Math.cos(t * orbitSpeedY + floatPhase) * 10;
    const rotZ = baseRotateZ + Math.sin(t * 0.3 + floatPhase) * 3;

    // ─── Floating bob (zero gravity drift) ───
    const floatX = Math.sin(t * 0.6 + floatPhase) * 8;
    const floatY = Math.cos(t * 0.4 + floatPhase * 0.7) * 10;

    // ─── Scroll drift (moves as you scroll) ───
    const scrollDriftX = driftX * windowT;
    const scrollDriftY = driftY * windowT;

    // ─── Scale: enter small → full → slightly larger ───
    const scale = 0.7 + opacity * 0.3;

    const transform = [
        `perspective(600px)`,
        `translate3d(${scrollDriftX + floatX}px, ${scrollDriftY + floatY}px, 0)`,
        `rotateX(${rotX}deg)`,
        `rotateY(${rotY}deg)`,
        `rotateZ(${rotZ}deg)`,
        `scale(${scale})`,
    ].join(' ');

    return (
        <div
            className="polaroid-3d"
            style={{ left, top, opacity, transform }}
        >
            <div className="polaroid-3d__body">
                <div className="polaroid-3d__photo-wrap">
                    <img
                        src={src}
                        alt=""
                        className="polaroid-3d__photo"
                        loading="eager"
                        draggable={false}
                    />
                    {/* Light reflection streak */}
                    <div className="polaroid-3d__light-streak" />
                </div>
            </div>
            {/* Cosmic glow aura */}
            <div className="polaroid-3d__cosmos-glow" />
        </div>
    );
}

export default function FloatingMemories() {
    const scrollProgress = useUniverse((s) => s.scrollProgress);
    const [time, setTime] = React.useState(0);

    React.useEffect(() => {
        let raf;
        const tick = (t) => {
            setTime(t);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    if (scrollProgress < 0.14 || scrollProgress > 0.44) return null;

    return (
        <div className="floating-memories-container">
            {MEMORIES.map((memory, i) => (
                <MemoryCard
                    key={i}
                    memory={memory}
                    scrollProgress={scrollProgress}
                    time={time}
                />
            ))}
        </div>
    );
}
