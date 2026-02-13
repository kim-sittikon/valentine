import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useUniverse from '../store/useUniverse';

/**
 * ShockwaveRing — Visible ring mesh + point light that expands
 * at the gravity→love transition.
 *
 * - Ring geometry with additive blending
 * - Scales from 0 → 50 while fading out
 * - Point light pulses with the ring
 * - Looks like an energy explosion
 */

export default function ShockwaveRing() {
    const ringRef = useRef();
    const lightRef = useRef();
    const ring2Ref = useRef();

    useFrame(() => {
        const { shockwave } = useUniverse.getState();

        if (!shockwave || !ringRef.current) {
            // Hide when no shockwave
            if (ringRef.current) {
                ringRef.current.visible = false;
                ring2Ref.current.visible = false;
                lightRef.current.intensity = 0;
            }
            return;
        }

        const t = shockwave.time;
        const strength = shockwave.strength;
        const timeFade = 1.0 - Math.min(1, t / 2.0);

        if (timeFade <= 0.01) {
            ringRef.current.visible = false;
            ring2Ref.current.visible = false;
            lightRef.current.intensity = 0;
            return;
        }

        // ─── Primary ring ───
        ringRef.current.visible = true;
        const scale = t * 25.0;  // expand speed
        ringRef.current.scale.set(scale, scale, scale);
        ringRef.current.material.opacity = timeFade * 0.5 * strength;
        // Subtle rotation for organic feel
        ringRef.current.rotation.z = t * 0.5;
        ringRef.current.rotation.x = Math.sin(t * 2) * 0.1;

        // ─── Secondary ring (slightly delayed, different color) ───
        ring2Ref.current.visible = true;
        const scale2 = Math.max(0, t - 0.1) * 22.0;
        ring2Ref.current.scale.set(scale2, scale2, scale2);
        ring2Ref.current.material.opacity = timeFade * 0.3 * strength;
        ring2Ref.current.rotation.z = -t * 0.3;

        // ─── Light pulse ───
        lightRef.current.intensity = timeFade * strength * 5.0;
        // Slight flicker
        lightRef.current.intensity *= 0.9 + Math.sin(t * 30) * 0.1;
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Primary shockwave ring — pink */}
            <mesh ref={ringRef} visible={false}>
                <ringGeometry args={[0.85, 1.0, 128]} />
                <meshBasicMaterial
                    color="#ff6fa3"
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* Secondary ring — slightly different color for depth */}
            <mesh ref={ring2Ref} visible={false}>
                <ringGeometry args={[0.90, 1.0, 128]} />
                <meshBasicMaterial
                    color="#c471ed"
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* Light pulse — energy explosion feel */}
            <pointLight
                ref={lightRef}
                color="#ff4fa3"
                intensity={0}
                distance={80}
                decay={2}
            />
        </group>
    );
}
