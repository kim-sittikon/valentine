import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useUniverse from '../store/useUniverse';

export default function useAdaptiveQuality() {
    const { gl } = useThree();
    const frames = useRef([]);
    const lastCheck = useRef(0);
    const currentDPR = useRef(Math.min(window.devicePixelRatio, 2));
    const targetDPR = useRef(currentDPR.current);
    const consecutiveLow = useRef(0);
    const consecutiveHigh = useRef(0);

    useFrame((_, delta) => {
        const fps = 1 / Math.max(delta, 0.001);
        frames.current.push(fps);
        useUniverse.getState().setFps(Math.round(fps));

        const now = performance.now();
        if (now - lastCheck.current > 2000 && frames.current.length > 60) {
            const sorted = [...frames.current].sort((a, b) => a - b);
            const avg = frames.current.reduce((a, b) => a + b) / frames.current.length;
            const percentile1 = sorted[Math.floor(sorted.length * 0.01)];

            if (avg < 35 || percentile1 < 20) {
                consecutiveLow.current++;
                consecutiveHigh.current = 0;
                if (consecutiveLow.current >= 2 && currentDPR.current > 0.75) {
                    targetDPR.current = Math.max(0.75, currentDPR.current - 0.5);
                }
            } else if (avg > 55 && percentile1 > 45) {
                consecutiveHigh.current++;
                consecutiveLow.current = 0;
                if (consecutiveHigh.current >= 3) {
                    targetDPR.current = Math.min(
                        Math.min(window.devicePixelRatio, 2),
                        currentDPR.current + 0.25
                    );
                }
            } else {
                consecutiveLow.current = 0;
                consecutiveHigh.current = 0;
            }

            if (Math.abs(currentDPR.current - targetDPR.current) > 0.01) {
                currentDPR.current += (targetDPR.current - currentDPR.current) * 0.3;
                gl.setPixelRatio(currentDPR.current);
                const quality = currentDPR.current < 1 ? 'low' :
                    currentDPR.current < 1.5 ? 'medium' : 'high';
                useUniverse.getState().setQuality(quality);
            }

            frames.current = [];
            lastCheck.current = now;
        }
    });
}
