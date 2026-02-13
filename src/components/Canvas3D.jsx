import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleUniverse from './ParticleUniverse';
import CameraRig from './CameraRig';
import PostFX from './PostFX';
import useAdaptiveQuality from '../hooks/useAdaptiveQuality';

// Inner component to use R3F hooks (must be inside Canvas)
function PerformanceMonitor() {
    useAdaptiveQuality();
    return null;
}

// WebGL capability check (Section 20C)
function getWebGLCapabilities() {
    try {
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2');
        const gl1 = canvas.getContext('webgl');
        const gl = gl2 || gl1;

        let renderer = 'unknown';
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            renderer = debugInfo
                ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                : 'no debug info';
        }

        return {
            webgl2: !!gl2,
            webgl1: !!gl1,
            maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048,
            renderer,
        };
    } catch {
        return { webgl2: false, webgl1: false, maxTextureSize: 2048, renderer: 'error' };
    }
}

const caps = getWebGLCapabilities();

export default function Canvas3D() {
    const postFXEnabled = caps.webgl2;
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // ★ Resize handler (Criteria 1)
    useEffect(() => {
        const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div className="canvas-wrapper" style={{ width: size.width, height: size.height }}>
            <Canvas
                gl={{
                    antialias: caps.webgl2,
                    alpha: false,
                    powerPreference: 'high-performance',
                }}
                dpr={[1, Math.min(window.devicePixelRatio, 2)]}
                camera={{ position: [0, 0, 100], fov: 60, near: 0.1, far: 500 }}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x0f0c29);
                    console.log(
                        `[Galaxy] ✅ Render Core Ready\n` +
                        `  GPU: ${caps.renderer}\n` +
                        `  WebGL2: ${caps.webgl2}\n` +
                        `  DPR: ${Math.min(window.devicePixelRatio, 2).toFixed(1)}\n` +
                        `  Max Texture: ${caps.maxTextureSize}\n` +
                        `  PostFX: ${postFXEnabled ? 'ON' : 'OFF (WebGL1 fallback)'}`
                    );
                }}
                resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
            >
                <ParticleUniverse />
                <CameraRig />
                <PerformanceMonitor />
                {/* PostFX disabled for debugging - uncomment when particles work */}
                {/* {postFXEnabled && <PostFX />} */}
            </Canvas>
        </div>
    );
}
