import { useEffect, useRef, useCallback } from 'react';
import { AudioManager } from '../utils/audioManager';
import useUniverse from '../store/useUniverse';

const audioManager = new AudioManager();

export default function useAudio() {
    const prevScene = useRef('void');
    const isInit = useRef(false);

    const initAudio = useCallback(async () => {
        if (isInit.current) return;
        await audioManager.init();
        isInit.current = true;
        audioManager.startDrone();
    }, []);

    useEffect(() => {
        const unsub = useUniverse.subscribe(
            (state) => state.currentScene,
            (scene) => {
                if (!isInit.current) return;
                const prev = prevScene.current;

                if (scene === 'memory' && prev !== 'memory') {
                    audioManager.playSparkle();
                }
                if (scene === 'chaos' && prev !== 'chaos') {
                    audioManager.playWhoosh();
                }
                if (scene === 'gravity' && prev !== 'gravity') {
                    audioManager.playImpact();
                }
                if (scene === 'love' && prev !== 'love') {
                    audioManager.startHeartbeat();
                }
                if (prev === 'love' && scene !== 'love') {
                    audioManager.stopHeartbeat();
                }

                prevScene.current = scene;
            }
        );

        return () => {
            unsub();
            audioManager.dispose();
        };
    }, []);

    return { audioManager, initAudio };
}
