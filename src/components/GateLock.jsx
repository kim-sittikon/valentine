import React, { useState, useRef, useEffect, useCallback } from 'react';
import useUniverse from '../store/useUniverse';

/**
 * GateLock — Mini-game gate before Galaxy experience.
 *
 * "ระบบนำร่อง" themed lock screen with 3 dial pickers (day/month/year).
 * Correct date (01/01/2024) → warp explosion → enter galaxy.
 * Wrong date → particles scatter + shake.
 */

const CORRECT = { day: 1, month: 1, year: 2024 };

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 7 }, (_, i) => 2020 + i);

const MONTH_NAMES = [
    '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// ─── Single Dial Wheel ───
function DialWheel({ items, value, onChange, formatFn }) {
    const containerRef = useRef(null);
    const ITEM_HEIGHT = 52;
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScroll = useRef(0);

    const currentIndex = items.indexOf(value);

    // Scroll to selected item
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const target = currentIndex * ITEM_HEIGHT;
        el.scrollTo({ top: target, behavior: 'smooth' });
    }, [currentIndex]);

    // Handle scroll snap to nearest item  
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el || isDragging.current) return;

        clearTimeout(el._snapTimer);
        el._snapTimer = setTimeout(() => {
            const scrollTop = el.scrollTop;
            const index = Math.round(scrollTop / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
            if (items[clampedIndex] !== value) {
                onChange(items[clampedIndex]);
            }
            el.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: 'smooth' });
        }, 80);
    }, [items, value, onChange]);

    // Touch/mouse handlers
    const handlePointerDown = (e) => {
        isDragging.current = true;
        startY.current = e.clientY || e.touches?.[0]?.clientY || 0;
        startScroll.current = containerRef.current?.scrollTop || 0;
    };

    const handlePointerUp = () => {
        isDragging.current = false;
        handleScroll();
    };

    return (
        <div className="dial-wheel-wrapper">
            {/* Gradient overlays for fade effect */}
            <div className="dial-fade dial-fade--top" />
            <div className="dial-fade dial-fade--bottom" />
            {/* Selection highlight bar */}
            <div className="dial-highlight" />

            <div
                ref={containerRef}
                className="dial-wheel-scroll"
                onScroll={handleScroll}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Spacer top */}
                <div style={{ height: ITEM_HEIGHT * 2 }} />
                {items.map((item) => {
                    const isSelected = item === value;
                    return (
                        <div
                            key={item}
                            className={`dial-item ${isSelected ? 'dial-item--selected' : ''}`}
                            style={{ height: ITEM_HEIGHT }}
                            onClick={() => onChange(item)}
                        >
                            {formatFn ? formatFn(item) : item}
                        </div>
                    );
                })}
                {/* Spacer bottom */}
                <div style={{ height: ITEM_HEIGHT * 2 }} />
            </div>
        </div>
    );
}

// ─── Floating Particles Background ───
function GateParticles({ shake }) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Init 150 particles
        const particles = [];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2.5 + 0.5,
                alpha: Math.random() * 0.6 + 0.2,
                pulse: Math.random() * Math.PI * 2,
            });
        }
        particlesRef.current = particles;

        let shakeOffset = { x: 0, y: 0 };
        let shakeDecay = 0;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Shake decay
            if (shakeDecay > 0.01) {
                shakeOffset.x = (Math.random() - 0.5) * shakeDecay * 15;
                shakeOffset.y = (Math.random() - 0.5) * shakeDecay * 15;
                shakeDecay *= 0.92;
            } else {
                shakeOffset.x = 0;
                shakeOffset.y = 0;
            }

            ctx.save();
            ctx.translate(shakeOffset.x, shakeOffset.y);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.02;

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 117, 140, ${a})`;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 126, 179, ${a * 0.15})`;
                ctx.fill();
            }

            ctx.restore();
            rafRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Expose shake trigger
        canvas._triggerShake = () => { shakeDecay = 1.0; };

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    // Trigger shake when prop changes
    useEffect(() => {
        if (shake > 0 && canvasRef.current?._triggerShake) {
            canvasRef.current._triggerShake();
        }
    }, [shake]);

    return <canvas ref={canvasRef} className="gate-particles" />;
}

// ─── Warp Explosion Overlay ───
function WarpExplosion({ active, onComplete }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const lines = [];

        // Create warp lines
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            lines.push({
                angle,
                speed: 2 + Math.random() * 8,
                length: 20 + Math.random() * 80,
                dist: 0,
                width: 0.5 + Math.random() * 2,
                hue: 330 + Math.random() * 40, // pink hues
            });
        }

        let frame = 0;
        const maxFrames = 90; // 1.5s at 60fps
        let brightness = 0;

        const animate = () => {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // White flash build-up
            brightness = Math.min(1, frame / maxFrames * 1.8);

            for (const l of lines) {
                l.dist += l.speed * (1 + frame * 0.1);
                const x1 = cx + Math.cos(l.angle) * l.dist;
                const y1 = cy + Math.sin(l.angle) * l.dist;
                const x2 = cx + Math.cos(l.angle) * (l.dist + l.length);
                const y2 = cy + Math.sin(l.angle) * (l.dist + l.length);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `hsla(${l.hue}, 100%, 80%, ${Math.max(0, 1 - frame / maxFrames)})`;
                ctx.lineWidth = l.width;
                ctx.stroke();
            }

            // White flash overlay
            if (brightness > 0.3) {
                ctx.fillStyle = `rgba(255, 255, 255, ${(brightness - 0.3) * 1.4})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                onComplete();
            }
        };

        animate();
    }, [active, onComplete]);

    if (!active) return null;

    return <canvas ref={canvasRef} className="warp-explosion" />;
}

// ─── Main GateLock Component ───
export default function GateLock({ initAudio }) {
    const [day, setDay] = useState(14);
    const [month, setMonth] = useState(2);
    const [year, setYear] = useState(2024);
    const [shakeCount, setShakeCount] = useState(0);
    const [error, setError] = useState('');
    const [warping, setWarping] = useState(false);
    const [exitFade, setExitFade] = useState(false);

    const handleSubmit = () => {
        if (warping) return;

        if (day === CORRECT.day && month === CORRECT.month && year === CORRECT.year) {
            // ✅ Correct! Trigger warp + start audio
            setError('');
            setWarping(true);
            if (initAudio) initAudio();
        } else {
            // ❌ Wrong — shake + scatter
            setShakeCount((c) => c + 1);
            setError('พิกัดเวลาไม่ถูกต้อง... ลองอีกครั้ง\nวันที่เป็นแฟนกันวันแรก');
            setTimeout(() => setError(''), 2500);
        }
    };

    const handleWarpComplete = useCallback(() => {
        setExitFade(true);
        setTimeout(() => {
            useUniverse.getState().setGateUnlocked(true);
        }, 600);
    }, []);

    return (
        <div className={`gate-lock ${exitFade ? 'gate-lock--exit' : ''}`}>
            <GateParticles shake={shakeCount} />

            {/* Cosmic aura */}
            <div className="gate-aura" />

            <div className="gate-content">
                {/* Lock icon */}
                <div className="gate-icon">🔭</div>

                {/* Title */}
                <h1 className="gate-title">ระบบนำร่องถูกล็อค</h1>
                <p className="gate-subtitle">
                    กรุณาระบุพิกัดเวลาเริ่มต้น<br />
                    เพื่อเดินทางสู่จักรวาลของเรา
                </p>

                {/* Dial Pickers */}
                <div className="gate-dials">
                    <div className="gate-dial-group">
                        <span className="gate-dial-label">วัน</span>
                        <DialWheel
                            items={DAYS}
                            value={day}
                            onChange={setDay}
                            formatFn={(d) => String(d).padStart(2, '0')}
                        />
                    </div>
                    <span className="gate-dial-separator">/</span>
                    <div className="gate-dial-group">
                        <span className="gate-dial-label">เดือน</span>
                        <DialWheel
                            items={MONTHS}
                            value={month}
                            onChange={setMonth}
                            formatFn={(m) => MONTH_NAMES[m]}
                        />
                    </div>
                    <span className="gate-dial-separator">/</span>
                    <div className="gate-dial-group">
                        <span className="gate-dial-label">ปี</span>
                        <DialWheel
                            items={YEARS}
                            value={year}
                            onChange={setYear}
                            formatFn={(y) => String(y)}
                        />
                    </div>
                </div>

                {/* Error message */}
                <div className={`gate-error ${error ? 'visible' : ''}`}>
                    {error}
                </div>

                {/* Submit Button */}
                <button
                    className={`gate-submit ${warping ? 'gate-submit--warping' : ''}`}
                    onClick={handleSubmit}
                    disabled={warping}
                >
                    <span className="gate-submit-text">
                        {warping ? 'กำลังเปิดประตูจักรวาล...' : 'เปิดประตูจักรวาล'}
                    </span>
                    <span className="gate-submit-glow" />
                </button>
            </div>

            <WarpExplosion active={warping} onComplete={handleWarpComplete} />
        </div>
    );
}
