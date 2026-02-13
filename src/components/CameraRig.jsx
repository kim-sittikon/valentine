import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useUniverse from '../store/useUniverse';
import { getSceneByName } from '../config/sceneConfig';

/**
 * Simple CPU noise for camera shake (no hash collision artifacts).
 * Based on a sin-wave pseudo-noise approach — much smoother than random.
 */
function smoothNoise(t, seed) {
    return (
        Math.sin(t * 1.0 + seed) * 0.5 +
        Math.sin(t * 2.3 + seed * 1.7) * 0.3 +
        Math.sin(t * 5.1 + seed * 0.3) * 0.2
    );
}

export default function CameraRig() {
    const groupRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;

        const { currentScene, localProgress } = useUniverse.getState();
        const t = state.clock.elapsedTime;

        // ─── Config-driven camera values ───
        const config = getSceneByName(currentScene);
        if (!config) return;

        const { camera } = config;

        // Dolly zoom — smooth lerp toward config target Z
        const targetZ = camera.z;
        groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.02;

        // ─── ★ Noise-based micro shake (not random) ───
        const shakeIntensity = camera.shake || 0;
        if (shakeIntensity > 0) {
            // Multi-frequency noise — organic, physical camera feel
            const shakeX = smoothNoise(t * 8, 0) * shakeIntensity;
            const shakeY = smoothNoise(t * 6, 10) * shakeIntensity * 0.67;

            // Smooth lerp to avoid snapping
            groupRef.current.position.x +=
                (shakeX - groupRef.current.position.x) * 0.15;
            groupRef.current.position.y +=
                (shakeY - groupRef.current.position.y) * 0.15;
        } else {
            groupRef.current.position.x *= 0.95;
            groupRef.current.position.y *= 0.95;
        }

        // ─── Breathing (config-driven amplitude) ───
        const breathAmp = camera.breathing || 0;
        if (breathAmp > 0) {
            const breathOffset = Math.sin(t * 0.8) * breathAmp;
            groupRef.current.position.z += breathOffset;
        }

        // ─── Orbit (config-driven speed + damping) ───
        const orbitSpeed = camera.orbitSpeed || 0;
        if (orbitSpeed > 0) {
            groupRef.current.rotation.y = Math.sin(t * orbitSpeed) * 0.3;
        } else {
            groupRef.current.rotation.y *= 0.98;
        }

        // Push to Three.js camera
        state.camera.position.z = groupRef.current.position.z;
        state.camera.position.x = groupRef.current.position.x;
        state.camera.position.y = groupRef.current.position.y;
        state.camera.rotation.y = groupRef.current.rotation.y;
    });

    return <group ref={groupRef} />;
}
