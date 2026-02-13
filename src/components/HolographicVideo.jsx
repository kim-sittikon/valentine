import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useUniverse from '../store/useUniverse';

/**
 * HolographicVideo — Marvel-level holographic orb effect.
 *
 * Instead of a flat rectangle, this renders a CIRCULAR hologram:
 *  - Custom shader with circular vignette mask
 *  - Black pixels become transparent (additive blending)
 *  - Scanlines + chromatic aberration
 *  - Pulsing glow ring around edges
 *  - Positioned small & behind particles (z = -1)
 *  - Ghost-like: only bright parts of video visible
 */

// Hologram vertex shader
const holoVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Hologram fragment shader — circular mask + scanlines + chromatic shift
const holoFragmentShader = `
uniform sampler2D uVideoTex;
uniform float uOpacity;
uniform float uTime;
uniform vec3 uTint;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center);

    // ── Circular mask: soft fade from center to edge ──
    float circle = 1.0 - smoothstep(0.28, 0.50, dist);

    // ── Scanlines: subtle horizontal lines ──
    float scanline = 0.92 + 0.08 * sin(uv.y * 200.0 + uTime * 5.0);

    // ── Chromatic aberration: slight RGB offset ──
    float aberration = 0.003 + 0.001 * sin(uTime * 2.0);
    vec2 rOffset = vec2(aberration, 0.0);
    vec2 bOffset = vec2(-aberration, 0.0);

    float r = texture2D(uVideoTex, uv + rOffset).r;
    float g = texture2D(uVideoTex, uv).g;
    float b = texture2D(uVideoTex, uv + bOffset).b;
    vec3 videoColor = vec3(r, g, b);

    // ── Brightness boost: make bright parts pop ──
    float luminance = dot(videoColor, vec3(0.299, 0.587, 0.114));
    videoColor = mix(videoColor, videoColor * 1.6, luminance);

    // ── Tint with holographic color ──
    vec3 tinted = mix(videoColor, uTint * videoColor * 2.0, 0.35);

    // ── Edge glow ring ──
    float ring = smoothstep(0.32, 0.42, dist) * (1.0 - smoothstep(0.42, 0.50, dist));
    float ringPulse = 0.5 + 0.5 * sin(uTime * 3.0);
    vec3 ringColor = uTint * 1.5 * ring * ringPulse;

    // ── Combine ──
    vec3 finalColor = tinted * scanline + ringColor;

    // ── Flicker ──
    float flicker = 0.95 + 0.05 * sin(uTime * 15.0);

    float alpha = circle * uOpacity * flicker;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export default function HolographicVideo() {
    const meshRef = useRef();
    const shaderRef = useRef();
    const videoRef = useRef(null);
    const [videoReady, setVideoReady] = useState(false);
    const textureRef = useRef(null);
    const glowRingRef = useRef();
    const innerGlowRef = useRef();

    const PRELOAD_AT = 0.83;
    const PLAY_AT = 0.85;
    const VISIBLE_AT = 0.88;
    const MAX_OPACITY = 0.65;

    // Shader uniforms
    const uniforms = useMemo(() => ({
        uVideoTex: { value: null },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uTint: { value: new THREE.Color('#c8a0ff') },
    }), []);

    // Create video element
    useEffect(() => {
        const video = document.createElement('video');
        video.src = '/video/moment.mp4';
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        video.addEventListener('canplaythrough', () => setVideoReady(true));
        videoRef.current = video;

        return () => {
            video.pause();
            video.src = '';
            video.load();
            videoRef.current = null;
            if (textureRef.current) {
                textureRef.current.dispose();
                textureRef.current = null;
            }
        };
    }, []);

    // Create texture when video ready
    useEffect(() => {
        if (videoReady && videoRef.current && !textureRef.current) {
            const tex = new THREE.VideoTexture(videoRef.current);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.format = THREE.RGBAFormat;
            tex.colorSpace = THREE.SRGBColorSpace;
            textureRef.current = tex;
        }
    }, [videoReady]);

    useFrame((_, delta) => {
        const scrollProgress = useUniverse.getState().scrollProgress;
        const video = videoRef.current;
        const shader = shaderRef.current;
        const mesh = meshRef.current;

        if (!video || !shader) return;

        // Preload
        if (scrollProgress >= PRELOAD_AT && video.preload === 'metadata') {
            video.preload = 'auto';
            video.load();
        }

        // Play/Pause
        if (scrollProgress >= PLAY_AT && videoReady) {
            if (video.paused) video.play().catch(() => { });
        } else if (!video.paused) {
            video.pause();
        }

        // Opacity
        let targetOpacity = 0;
        if (scrollProgress >= VISIBLE_AT) {
            const fadeT = Math.min(1, (scrollProgress - VISIBLE_AT) / 0.08);
            targetOpacity = fadeT * fadeT * (3 - 2 * fadeT) * MAX_OPACITY;
        }

        // Smooth lerp
        shader.uniforms.uOpacity.value +=
            (targetOpacity - shader.uniforms.uOpacity.value) * 0.06;

        // Time
        shader.uniforms.uTime.value += delta;

        // Assign texture
        if (textureRef.current && !shader.uniforms.uVideoTex.value) {
            shader.uniforms.uVideoTex.value = textureRef.current;
        }

        // Glow rings follow opacity
        const currentOp = shader.uniforms.uOpacity.value;
        if (glowRingRef.current) {
            glowRingRef.current.material.opacity = currentOp * 0.25;
        }
        if (innerGlowRef.current) {
            innerGlowRef.current.material.opacity = currentOp * 0.4;
        }

        // Hologram effects on mesh
        if (mesh && currentOp > 0.01) {
            const t = shader.uniforms.uTime.value;

            // Breathing scale
            const pulse = 1.0 + Math.sin(t * 1.5) * 0.012;
            mesh.scale.set(pulse, pulse, 1);

            // Gentle float
            mesh.position.y = 0.3 + Math.sin(t * 0.7) * 0.12;
            mesh.position.x = Math.cos(t * 0.4) * 0.06;

            // Slowly rotate to feel alive
            mesh.rotation.z = Math.sin(t * 0.3) * 0.02;
        }
    });

    return (
        <group position={[0, 0, -0.5]}>
            {/* Outer glow ring — soft pink/purple aura */}
            <mesh ref={glowRingRef} position={[0, 0.3, -0.3]}>
                <ringGeometry args={[2.2, 3.5, 64]} />
                <meshBasicMaterial
                    color="#ff7eb3"
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Inner glow — soft core light */}
            <mesh ref={innerGlowRef} position={[0, 0.3, -0.2]}>
                <circleGeometry args={[1.8, 64]} />
                <meshBasicMaterial
                    color="#d4a0ff"
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* Holographic video circle — custom shader */}
            <mesh ref={meshRef} position={[0, 0.3, 0]}>
                <circleGeometry args={[2.5, 64]} />
                <shaderMaterial
                    ref={shaderRef}
                    vertexShader={holoVertexShader}
                    fragmentShader={holoFragmentShader}
                    uniforms={uniforms}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}
