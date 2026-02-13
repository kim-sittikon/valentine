import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useUniverse from '../store/useUniverse';
import { getAudioManagerRef } from '../store/audioState';
import { getSceneByName } from '../config/sceneConfig';
import { generateHeart } from '../utils/heartGenerator';
import { generateProposal } from '../utils/proposalGenerator';
import { sampleImage } from '../utils/imageSampler';
import vertexShader from '../shaders/particleVertex.glsl';
import fragmentShader from '../shaders/particleFragment.glsl';

// Device-aware particle count
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

        if (isMobile) return memory >= 6 ? 30000 : 18000;
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
    const [imageLoaded, setImageLoaded] = useState(false);

    // Generate initial data (positions, heart target, colors, etc.)
    const particleData = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);
        const delays = new Float32Array(PARTICLE_COUNT);
        const randoms = new Float32Array(PARTICLE_COUNT * 3);
        const lives = new Float32Array(PARTICLE_COUNT);
        const brightnesses = new Float32Array(PARTICLE_COUNT);

        // Heart as morph target B
        const heart = generateHeart(PARTICLE_COUNT);

        // Proposal silhouette as morph target C (void scene)
        const proposal = generateProposal(PARTICLE_COUNT);

        // Placeholder for photo target A (filled async)
        const photoTargets = new Float32Array(PARTICLE_COUNT * 3);

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

            sizes[i] = Math.random() * 2.5 + 0.8;
            delays[i] = Math.random();
            lives[i] = 1.0;
            brightnesses[i] = 0.5 + Math.random() * 0.5;

            randoms[i * 3] = Math.random();
            randoms[i * 3 + 1] = Math.random();
            randoms[i * 3 + 2] = Math.random();
        }

        console.log(`[Galaxy] Particles: ${PARTICLE_COUNT.toLocaleString()}`);
        return {
            positions, colors, sizes, delays, randoms, lives, brightnesses,
            heartTargets: heart.positions,
            proposalTargets: proposal.positions,
            photoTargets,
        };
    }, []);

    // ─── Async load couple photo → aTargetA ───
    useEffect(() => {
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || ('ontouchstart' in window);
        const sampleSize = isMobile ? 280 : 500;
        sampleImage('/photos/couple.webp', sampleSize, PARTICLE_COUNT).then((result) => {
            const geom = geometryRef.current;
            if (!geom) return;

            // Update aTargetA buffer with photo positions
            const targetAttr = geom.attributes.aTargetA;
            if (targetAttr) {
                targetAttr.array.set(result.positions);
                targetAttr.needsUpdate = true;
            }

            // Update aColor with photo colors (for memory scene)
            const colorAttr = geom.attributes.aColor;
            if (colorAttr) {
                colorAttr.array.set(result.colors);
                colorAttr.needsUpdate = true;
            }

            // Update aBrightness with photo brightness
            const brightAttr = geom.attributes.aBrightness;
            if (brightAttr) {
                brightAttr.array.set(result.brightness);
                brightAttr.needsUpdate = true;
            }

            setImageLoaded(true);
            console.log('[Galaxy] 📷 Photo morph target loaded');
        }).catch((err) => {
            console.warn('[Galaxy] ⚠️ Photo load failed, using heart only:', err.message);
        });
    }, []);

    // Shader uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uMorphPhase: { value: 0 },
        uWarpStretch: { value: 0 },
        uEnergy: { value: 0.2 },
        uPointScale: { value: 1.0 },
        uBeat: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uMouseRadius: { value: 8.0 },
        uMouseActive: { value: 0 },
        uMouseVelocity: { value: new THREE.Vector2() },
        uFogDensity: { value: 0.012 },
        uFogColor: { value: new THREE.Color(0x0f0c29) },
        uProposalPhase: { value: 0 },
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
            morphPhase, warpStretch, currentScene,
            mousePos, mouseVel, mouseInteraction, shockwave, sceneEnergy,
        } = useUniverse.getState();

        const mat = materialRef.current;
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uMorphPhase.value = morphPhase;
        mat.uniforms.uWarpStretch.value = warpStretch;
        mat.uniforms.uEnergy.value += (sceneEnergy - mat.uniforms.uEnergy.value) * 0.05;
        mat.uniforms.uMouse.value.set(mousePos.x, mousePos.y);

        // ─── Dynamic Fog per scene ───
        const sceneConfig = getSceneByName(currentScene);
        if (sceneConfig) {
            const targetFogDensity = sceneConfig.postfx.fogDensity;
            mat.uniforms.uFogDensity.value += (targetFogDensity - mat.uniforms.uFogDensity.value) * 0.04;

            const fc = sceneConfig.postfx.fogColor;
            const fogCol = mat.uniforms.uFogColor.value;
            fogCol.r += (fc[0] - fogCol.r) * 0.04;
            fogCol.g += (fc[1] - fogCol.g) * 0.04;
            fogCol.b += (fc[2] - fogCol.b) * 0.04;
        }

        // ★ Mouse active = smooth transition (chaos scene only)
        const targetMouseActive = mouseInteraction ? 1.0 : 0.0;
        mat.uniforms.uMouseActive.value +=
            (targetMouseActive - mat.uniforms.uMouseActive.value) * 0.08;

        // ★ Mouse velocity → shader (smooth lerp to avoid jitter)
        mat.uniforms.uMouseVelocity.value.x +=
            (mouseVel.x - mat.uniforms.uMouseVelocity.value.x) * 0.15;
        mat.uniforms.uMouseVelocity.value.y +=
            (mouseVel.y - mat.uniforms.uMouseVelocity.value.y) * 0.15;

        // Void scene: dimmed particles + proposal morph
        const lifeAttr = geometryRef.current?.attributes.aLife;
        if (lifeAttr) {
            const targetLife = currentScene === 'void' ? 0.7 : 1.0;
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

        // Proposal silhouette phase: driven by scroll within void scene (0–10%)
        const { scrollProgress } = useUniverse.getState();
        const voidEnd = 0.10;
        let proposalTarget = 0;
        if (currentScene === 'void' && scrollProgress < voidEnd) {
            // Map scroll 0→voidEnd to proposal 0→1
            proposalTarget = Math.min(1.0, scrollProgress / (voidEnd * 0.8));
        } else if (currentScene === 'void') {
            proposalTarget = 1.0; // fully formed at end of void
        }
        // Smooth lerp toward target (not instant snap)
        mat.uniforms.uProposalPhase.value +=
            (proposalTarget - mat.uniforms.uProposalPhase.value) * 0.04;

        // ─── Audio reactive visuals (Feature 7) ───
        const _audioRef = getAudioManagerRef();
        if (_audioRef) {
            const audio = _audioRef.getAudioData();
            // Smooth bass (slow envelope) → particle expansion
            mat.uniforms.uAudioBass.value += (audio.slow - mat.uniforms.uAudioBass.value) * 0.15;
            // Fast envelope → sparkle/shimmer
            mat.uniforms.uAudioHigh.value += (audio.fast - mat.uniforms.uAudioHigh.value) * 0.15;
            // Real beat detection → heart pulse (not sin wave!)
            mat.uniforms.uBeat.value = audio.beatPhase;
            // Heart warmth from slow bass in love scene
            if (currentScene === 'love') {
                mat.uniforms.uHeartWarmth.value += (audio.slow * 0.15 - mat.uniforms.uHeartWarmth.value) * 0.1;
            } else {
                mat.uniforms.uHeartWarmth.value *= 0.95;
            }
            // Spatial panning from camera (Feature 6)
            _audioRef.setSpatialPan(state.camera.position.x);
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
                    attach="attributes-aTargetA"
                    count={PARTICLE_COUNT}
                    array={particleData.photoTargets}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aTargetB"
                    count={PARTICLE_COUNT}
                    array={particleData.heartTargets}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aTargetC"
                    count={PARTICLE_COUNT}
                    array={particleData.proposalTargets}
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
