import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    EffectComposer, Bloom, Noise, Vignette,
    ChromaticAberration, DepthOfField, HueSaturation,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import useUniverse from '../store/useUniverse';
import { getSceneByName } from '../config/sceneConfig';
import { getAudioManagerRef } from '../store/audioState';

/**
 * PostFX — Director-level cinematic post-processing
 *
 * Every value is config-driven from sceneConfig.js and smoothly lerped.
 * Energy + scroll velocity + audio drive dynamic bloom/CA for a living, reactive feel.
 */
export default function PostFX() {
    // ─── Refs for smooth lerping ───
    const bloomIntRef = useRef(0.3);
    const bloomThreshRef = useRef(0.5);
    const grainRef = useRef(0.02);
    const caRef = useRef(new Vector2(0, 0));
    const dofEnabledRef = useRef(false);
    const hueSatRef = useRef({ hue: 0, saturation: 0 });

    // ─── Per-frame dynamic updates ───
    useFrame(() => {
        const {
            currentScene, scrollProgress, scrollVelocity,
            warpStretch, sceneEnergy, localProgress,
        } = useUniverse.getState();

        const config = getSceneByName(currentScene);
        if (!config) return;

        const lerp = (a, b, t) => a + (b - a) * t;
        const speed = 0.06; // lerp speed for smooth transitions

        // ─── 1. Bloom: config base + energy + scroll velocity + audio (Feature 8) ───
        const energyBoost = sceneEnergy * 0.15;
        const velocityBoost = Math.min(Math.abs(scrollVelocity) * 0.8, 0.1);
        // Audio-driven bloom: fast envelope boosts bloom during chaos/gravity
        let audioBloomBoost = 0;
        if (currentScene === 'chaos' || currentScene === 'gravity') {
            const am = getAudioManagerRef();
            if (am) {
                const audio = am.getAudioData();
                audioBloomBoost = audio.fast * 0.6;
            }
        }
        const targetBloom = (config.bloom ?? 0.1) + energyBoost + velocityBoost + audioBloomBoost;
        bloomIntRef.current = lerp(bloomIntRef.current, Math.min(targetBloom, 0.35), speed);

        const targetThresh = config.postfx.bloomThreshold ?? 0.5;
        bloomThreshRef.current = lerp(bloomThreshRef.current, targetThresh, speed);

        // ─── 2. Grain ───
        const targetGrain = config.postfx.grain ?? 0.02;
        grainRef.current = lerp(grainRef.current, targetGrain, speed);

        // ─── 3. Chromatic Aberration: config + warp + smoothstep fade ───
        const caBase = config.postfx.ca ?? 0;

        // Smoothstep CA fade during gravity→love transition (0.55→0.75)
        // CA peaks in gravity, then fades to zero before Love
        const caFade = scrollProgress < 0.55 ? 1.0
            : scrollProgress > 0.75 ? 0.0
                : 1.0 - smoothstep(0.55, 0.75, scrollProgress);

        const caX = (caBase * 0.01 + warpStretch * 0.008) * caFade
            + Math.sin(scrollProgress * Math.PI) * 0.001 * caFade;
        const caY = (caBase * 0.007 + warpStretch * 0.005) * caFade;

        caRef.current.x = lerp(caRef.current.x, caX, speed);
        caRef.current.y = lerp(caRef.current.y, caY, speed);

        // ─── 4. DOF: only after heart stabilizes (love + localProgress > 0.3) ───
        dofEnabledRef.current = config.postfx.dof && localProgress > 0.3;

        // ─── 5. Color Grading: per-scene hue/saturation tint ───
        const tint = config.postfx.colorTint ?? [0, 0, 0];
        const tintMagnitude = Math.abs(tint[0]) + Math.abs(tint[1]) + Math.abs(tint[2]);
        // Map tint to hue shift (subtle) + saturation boost
        const targetHue = (tint[0] - tint[2]) * 2.0;  // red vs blue → warm/cool shift
        const targetSat = tintMagnitude > 0 ? 0.05 + tintMagnitude * 0.5 : 0;
        hueSatRef.current.hue = lerp(hueSatRef.current.hue, targetHue, speed);
        hueSatRef.current.saturation = lerp(hueSatRef.current.saturation, targetSat, speed);
    });

    return (
        <EffectComposer>
            <Bloom
                intensity={bloomIntRef.current}
                luminanceThreshold={bloomThreshRef.current}
                luminanceSmoothing={0.9}
                mipmapBlur
            />
            {dofEnabledRef.current && (
                <DepthOfField
                    focusDistance={0.02}
                    focalLength={0.05}
                    bokehScale={2.5}
                />
            )}
            <HueSaturation
                hue={hueSatRef.current.hue}
                saturation={hueSatRef.current.saturation}
                blendFunction={BlendFunction.NORMAL}
            />
            <ChromaticAberration
                offset={caRef.current}
                blendFunction={BlendFunction.NORMAL}
            />
            <Noise
                opacity={grainRef.current}
                blendFunction={BlendFunction.OVERLAY}
            />
            <Vignette
                offset={0.3}
                darkness={0.55}
                blendFunction={BlendFunction.NORMAL}
            />
        </EffectComposer>
    );
}

// ─── Utility: GLSL-style smoothstep ───
function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}
