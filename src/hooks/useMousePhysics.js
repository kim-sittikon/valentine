import { useCallback, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useUniverse from '../store/useUniverse';

// CPU curl noise for physics (Section 19A)
function hashNoise(x, y, z) {
    const dot = x * 12.9898 + y * 78.233 + z * 45.164;
    const s = Math.sin(dot) * 43758.5453;
    return s - Math.floor(s);
}

function curlNoiseCPU(x, y, z) {
    const eps = 0.01;
    const n1 = hashNoise(x, y + eps, z);
    const n2 = hashNoise(x, y - eps, z);
    const n3 = hashNoise(x, y, z + eps);
    const n4 = hashNoise(x, y, z - eps);
    const n5 = hashNoise(x + eps, y, z);
    const n6 = hashNoise(x - eps, y, z);

    return {
        x: (n1 - n2 - n3 + n4) / (2.0 * eps),
        y: (n3 - n4 - n5 + n6) / (2.0 * eps),
        z: (n5 - n6 - n1 + n2) / (2.0 * eps),
    };
}

export default function useMousePhysics(geometryRef, velocitiesRef) {
    const mouse3D = useRef(new THREE.Vector3());
    const raycaster = useRef(new THREE.Raycaster());
    const { camera } = useThree();
    const timeRef = useRef(0);

    const onPointerMove = useCallback((e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.current.setFromCamera({ x, y }, camera);
        const dir = raycaster.current.ray.direction.clone();
        mouse3D.current.copy(camera.position).add(dir.multiplyScalar(40));
        useUniverse.getState().setMousePos({ x, y });
    }, [camera]);

    useFrame((_, delta) => {
        if (!useUniverse.getState().mouseInteraction) return;
        if (!geometryRef.current) return;

        timeRef.current += delta;

        const positions = geometryRef.current.attributes.position.array;
        const targets = geometryRef.current.attributes.aTarget.array;
        const velocities = velocitiesRef.current;
        const mouse = mouse3D.current;
        const count = positions.length / 3;

        const repulsionRadius = 8;
        const repulsionStrength = 200;
        const springK = 2.0;
        const damping = 0.92;
        const curlStrength = 15.0;

        for (let i = 0; i < count; i++) {
            const ix = i * 3;

            const dx = positions[ix] - mouse.x;
            const dy = positions[ix + 1] - mouse.y;
            const dz = positions[ix + 2] - mouse.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < repulsionRadius && dist > 0.01) {
                const force = repulsionStrength / (dist * dist);

                velocities[ix] += (dx / dist) * force * delta * 0.4;
                velocities[ix + 1] += (dy / dist) * force * delta * 0.4;
                velocities[ix + 2] += (dz / dist) * force * delta * 0.4;

                // Curl noise nebula swirl
                const curl = curlNoiseCPU(
                    positions[ix] * 0.05 + timeRef.current * 0.3,
                    positions[ix + 1] * 0.05,
                    positions[ix + 2] * 0.05
                );
                const curlFade = 1.0 - dist / repulsionRadius;
                velocities[ix] += curl.x * curlStrength * curlFade * delta;
                velocities[ix + 1] += curl.y * curlStrength * curlFade * delta;
                velocities[ix + 2] += curl.z * curlStrength * curlFade * delta;
            }

            velocities[ix] += (targets[ix] - positions[ix]) * springK * delta;
            velocities[ix + 1] += (targets[ix + 1] - positions[ix + 1]) * springK * delta;
            velocities[ix + 2] += (targets[ix + 2] - positions[ix + 2]) * springK * delta;

            velocities[ix] *= damping;
            velocities[ix + 1] *= damping;
            velocities[ix + 2] *= damping;

            positions[ix] += velocities[ix] * delta;
            positions[ix + 1] += velocities[ix + 1] * delta;
            positions[ix + 2] += velocities[ix + 2] * delta;
        }

        geometryRef.current.attributes.position.needsUpdate = true;
    });

    return { onPointerMove };
}
