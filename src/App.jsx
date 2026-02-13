import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Canvas3D from './components/Canvas3D';
import BackgroundVideo from './components/BackgroundVideo';
import FloatingMemories from './components/FloatingMemories';
import Overlay from './components/Overlay';
import useScrollTimeline from './hooks/useScrollTimeline';
import useAudio from './hooks/useAudio';
import useUniverse from './store/useUniverse';
import { SCENES } from './config/sceneConfig';

// Error Boundary to catch R3F / shader crashes
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('[Galaxy] ❌ Render crash:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: '#0f0c29', color: '#ff758c', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', padding: 40, textAlign: 'center',
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>💫 Galaxy Error</h1>
                    <p style={{ color: '#f0e6ff', maxWidth: 600 }}>
                        {this.state.error?.message || 'Unknown error'}
                    </p>
                    <pre style={{ color: '#ff7eb3', fontSize: 12, marginTop: 16, maxWidth: '80vw', overflowX: 'auto' }}>
                        {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    useScrollTimeline();
    const { initAudio } = useAudio();

    // ─── Keyboard controls: backtick=debug, 0=top, 1-6=scene jump ───
    useEffect(() => {
        const handleKey = (e) => {
            // Backtick → toggle debug panel
            if (e.key === '`') {
                useUniverse.getState().toggleDebug();
                return;
            }

            // Key 0 → scroll to top
            if (e.key === '0') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Let GSAP catch up after scroll completes
                requestAnimationFrame(() => ScrollTrigger.update());
                console.log('[Galaxy] ⚡ Dev jump → top');
                return;
            }

            // Keys 1-6 → jump to scene midpoint
            const sceneIndex = parseInt(e.key, 10);
            if (sceneIndex >= 1 && sceneIndex <= 6 && sceneIndex <= SCENES.length) {
                const scene = SCENES[sceneIndex - 1];
                const midpoint = (scene.range[0] + scene.range[1]) / 2;
                const scrollContainer = document.getElementById('scroll-container');
                if (!scrollContainer) return;

                // Calculate target scroll position
                const scrollHeight = scrollContainer.scrollHeight - window.innerHeight;
                const targetY = midpoint * scrollHeight;

                window.scrollTo({ top: targetY, behavior: 'smooth' });

                // Sync ScrollTrigger after smooth scroll settles
                // Use a small delay so the scroll animation can start
                setTimeout(() => {
                    ScrollTrigger.update();
                }, 50);

                console.log(
                    `[Galaxy] ⚡ Dev jump → scene: ${scene.name}` +
                    ` (scroll: ${(midpoint * 100).toFixed(1)}%)`
                );
                return;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <ErrorBoundary>
            {/* Cinematic background video (scroll 85-100%) */}
            <BackgroundVideo />

            {/* Fixed 3D Canvas */}
            <Canvas3D />

            {/* Floating photo memories (HTML overlay, scroll 18-40%) */}
            <FloatingMemories />

            {/* HTML Overlay UI */}
            <Overlay initAudio={initAudio} />

            {/* Scroll container (drives timeline) */}
            <div id="scroll-container" />
        </ErrorBoundary>
    );
}
