import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useUniverse from '../store/useUniverse';
import { generateHeart } from '../utils/heartGenerator';
import vertexShader from '../shaders/particleVertex.glsl';
import fragmentShader from '../shaders/particleFragment.glsl';

// Device-aware particle count (Section 20B)
function getOptimalParticleCount() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return 20000;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : '';

        const isHighEnd = /RTX|RX 6|RX 7|M[1-3] |A1[4-9]|A[23]\d/i.test(renderer);
        const isLowEnd = /Intel|Mali|Adreno [1-5]/i.test(renderer);
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || ('ontouchstart' in window);
        const memory = navigator.deviceMemory || 4;

        if (isMobile) return memory >= 6 ? 40000 : 25000;
        if (isHighEnd) return 150000;
        if (isLowEnd) return 30000;
        return 80000;
    } catch {
        return 60000;
    }
}

const PARTICLE_COUNT = getOptimalParticleCount();

export default function ParticleUniverse() {
    const meshRef = useRef();
    const geometryRef = useRef();
    const materialRef = useRef();
    const velocitiesRef = useRef(new Float32Array(PARTICLE_COUNT * 3));

    // Generate initial data
    const particleData = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);
        const delays = new Float32Array(PARTICLE_COUNT);
        const randoms = new Float32Array(PARTICLE_COUNT * 3);
        const lives = new Float32Array(PARTICLE_COUNT);
        const brightnesses = new Float32Array(PARTICLE_COUNT);

        // Generate heart as default morph target
        const heart = generateHeart(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Random sphere distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.pow(Math.random(), 0.33) * 50;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;

            sizes[i] = Math.random() * 2 + 0.5;
            delays[i] = Math.random();
            lives[i] = 1.0;  // ★ visible from start (void scene)
            brightnesses[i] = 0.5 + Math.random() * 0.5;

            randoms[i * 3] = Math.random();
            randoms[i * 3 + 1] = Math.random();
            randoms[i * 3 + 2] = Math.random();
        }

        console.log(`[Galaxy] Particles: ${PARTICLE_COUNT.toLocaleString()}`);
        return { positions, colors, sizes, delays, randoms, lives, brightnesses, heartTargets: heart.positions };
    }, []);

    // Shader uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uMorphProgress: { value: 0 },
        uWarpStretch: { value: 0 },
        uPointScale: { value: 1.0 },
        uBeat: { value: 0 },
        uColorPhase: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uMouseRadius: { value: 8.0 },
        uFogDensity: { value: 0.012 },
        uFogColor: { value: new THREE.Color(0x0f0c29) },
        uAudioBass: { value: 0 },
        uAudioHigh: { value: 0 },
        uHeartWarmth: { value: 0 },
        uShockOrigin: { value: new THREE.Vector3() },
        uShockTime: { value: 0 },
        uShockStrength: { value: 0 },
    }), []);

    // Per-frame update
    useFrame((state, delta) => {
        if (!materialRef.current) return;

        const {
            morphProgress, warpStretch, currentScene,
            mousePos, colorPhase, shockwave,
        } = useUniverse.getState();

        const mat = materialRef.current;
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uMorphProgress.value = morphProgress;
        mat.uniforms.uWarpStretch.value = warpStretch;
        mat.uniforms.uColorPhase.value = colorPhase;
        mat.uniforms.uMouse.value.set(mousePos.x, mousePos.y);

        // Void scene: dimmed particles (subtle starfield)
        // Birth onwards: full brightness
        const lifeAttr = geometryRef.current?.attributes.aLife;
        if (lifeAttr) {
            const targetLife = currentScene === 'void' ? 0.3 : 1.0;
            const arr = lifeAttr.array;
            let needsUpdate = false;
            for (let i = 0; i < arr.length; i++) {
                if (Math.abs(arr[i] - targetLife) > 0.01) {
                    arr[i] += (targetLife - arr[i]) * delta * 2.0;
                    needsUpdate = true;
                }
            }
            if (needsUpdate) lifeAttr.needsUpdate = true;
        }

        // Love: heart beat
        if (currentScene === 'love') {
            const beat = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5;
            mat.uniforms.uBeat.value = beat;
            mat.uniforms.uHeartWarmth.value = beat * 0.1;
        } else {
            mat.uniforms.uBeat.value *= 0.95;
            mat.uniforms.uHeartWarmth.value *= 0.95;
        }

        // Shockwave
        if (shockwave) {
            mat.uniforms.uShockOrigin.value.set(
                shockwave.origin.x, shockwave.origin.y, shockwave.origin.z
            );
            mat.uniforms.uShockTime.value = shockwave.time;
            mat.uniforms.uShockStrength.value = shockwave.strength;
            useUniverse.getState().advanceShockwave(delta);
        } else {
            mat.uniforms.uShockTime.value = 0;
            mat.uniforms.uShockStrength.value = 0;
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={PARTICLE_COUNT}
                    array={particleData.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aTarget"
                    count={PARTICLE_COUNT}
                    array={particleData.heartTargets}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aColor"
                    count={PARTICLE_COUNT}
                    array={particleData.colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aSize"
                    count={PARTICLE_COUNT}
                    array={particleData.sizes}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aDelay"
                    count={PARTICLE_COUNT}
                    array={particleData.delays}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aLife"
                    count={PARTICLE_COUNT}
                    array={particleData.lives}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aRandom"
                    count={PARTICLE_COUNT}
                    array={particleData.randoms}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aBrightness"
                    count={PARTICLE_COUNT}
                    array={particleData.brightnesses}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
