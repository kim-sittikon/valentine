import React, { useEffect } from 'react';
import Canvas3D from './components/Canvas3D';
import Overlay from './components/Overlay';
import useScrollTimeline from './hooks/useScrollTimeline';
import useUniverse from './store/useUniverse';

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

    // Debug toggle with backtick key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === '`') {
                useUniverse.getState().toggleDebug();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <ErrorBoundary>
            {/* Fixed 3D Canvas */}
            <Canvas3D />

            {/* HTML Overlay UI */}
            <Overlay />

            {/* Scroll container (drives timeline) */}
            <div id="scroll-container" />
        </ErrorBoundary>
    );
}
