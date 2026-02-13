import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useUniverse from '../store/useUniverse';

export default function CameraRig() {
    const groupRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;

        const { currentScene } = useUniverse.getState();
        const t = state.clock.elapsedTime;

        // Dolly zoom based on scene
        const zMap = { void: 100, birth: 80, memory: 50, chaos: 40, gravity: 10, love: 30 };
        const targetZ = zMap[currentScene] || 50;
        groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.02;

        // Subtle shake during chaos
        if (currentScene === 'chaos') {
            groupRef.current.position.x = Math.sin(t * 15) * 0.15;
            groupRef.current.position.y = Math.cos(t * 12) * 0.1;
        } else {
            groupRef.current.position.x *= 0.95;
            groupRef.current.position.y *= 0.95;
        }

        // Slow orbit during love
        if (currentScene === 'love') {
            groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.3;
        } else {
            groupRef.current.rotation.y *= 0.98;
        }

        // Update camera position in Three.js
        state.camera.position.z = groupRef.current.position.z;
        state.camera.position.x = groupRef.current.position.x;
        state.camera.position.y = groupRef.current.position.y;
        state.camera.rotation.y = groupRef.current.rotation.y;
    });

    return <group ref={groupRef} />;
}
