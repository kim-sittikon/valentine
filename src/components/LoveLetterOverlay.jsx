import React from 'react';
import useUniverse from '../store/useUniverse';

/**
 * LoveLetterOverlay — Cinematic typewriter-style love letter.
 *
 * Appears after video fades out (scroll 90%–100%).
 * Each paragraph fades in sequentially as the user scrolls.
 * Layers ABOVE video (z:25) and canvas (z:1).
 */

const LETTER_SECTIONS = [
    {
        id: 'name',
        start: 0.90,
        type: 'name',
        text: 'ดื้อ…',
    },
    {
        id: 'apology',
        start: 0.92,
        type: 'paragraph',
        text: 'ก่อนอื่นเลย พี่คิมอยากขอโทษนะ\nสำหรับทุกครั้งที่พี่ทำให้ดื้อเสียใจ\nไม่ว่าจะตั้งใจหรือไม่ตั้งใจ',
    },
    {
        id: 'realize',
        start: 0.935,
        type: 'paragraph',
        text: 'บางครั้งพี่อาจพูดแรงไป\nบางครั้งอาจเผลอมองข้ามความรู้สึกของดื้อ\nพี่ไม่ได้อยากให้มันเป็นแบบนั้นเลย\n\nพี่รู้ว่าคำว่าขอโทษ\nอาจย้อนเวลาไม่ได้\nแต่พี่อยากให้ดื้อรู้ว่า\nพี่เห็นความผิดพลาดของตัวเองจริง ๆ',
    },
    {
        id: 'thanks',
        start: 0.95,
        type: 'paragraph',
        text: 'ขอบคุณที่ยังอยู่\nขอบคุณที่ยังให้โอกาส\nขอบคุณที่ไม่ปล่อยมือพี่ไป',
    },
    {
        id: 'promise',
        start: 0.965,
        type: 'paragraph',
        text: 'พี่สัญญาว่าจะพยายามให้มากขึ้น\nจะฟังมากขึ้น\nและจะดูแลหัวใจของดื้อให้ดีกว่านี้',
    },
    {
        id: 'final',
        start: 0.98,
        type: 'final',
        text: 'เพราะสำหรับพี่\nจักรวาลนี้จะไม่มีความหมายเลย\nถ้าไม่มีดื้ออยู่ในนั้น 💖',
    },
];

export default function LoveLetterOverlay() {
    const scrollProgress = useUniverse((s) => s.scrollProgress);

    // Don't render before love letter zone
    if (scrollProgress < 0.88) return null;

    // Container opacity: fade in from 88% to 91%
    const containerOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.88) / 0.03));

    return (
        <div
            className="love-letter-container"
            style={{ opacity: containerOpacity }}
        >
            {/* Floating sparkle particles (CSS-only) */}
            <div className="love-letter-sparkles" aria-hidden="true">
                {Array.from({ length: 20 }, (_, i) => (
                    <span
                        key={i}
                        className="love-sparkle"
                        style={{
                            left: `${10 + (i * 4.2) % 80}%`,
                            top: `${5 + (i * 7.3) % 90}%`,
                            animationDelay: `${(i * 0.37) % 5}s`,
                            animationDuration: `${3 + (i * 0.6) % 4}s`,
                        }}
                    />
                ))}
            </div>

            <div className="love-letter-scroll-area">
                {LETTER_SECTIONS.map((section) => {
                    // Fade in over ~1.5% scroll
                    const visibility = Math.min(1, Math.max(0,
                        (scrollProgress - section.start) / 0.015
                    ));

                    const className = [
                        'love-letter-block',
                        `love-letter-${section.type}`,
                        visibility > 0 ? 'visible' : '',
                    ].join(' ');

                    return (
                        <div
                            key={section.id}
                            className={className}
                            style={{
                                opacity: visibility,
                                transform: `translateY(${(1 - visibility) * 30}px)`,
                            }}
                        >
                            {section.text.split('\n').map((line, i, arr) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i < arr.length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
