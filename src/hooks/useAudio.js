import { useCallback, useRef } from 'react';
import { AudioManager } from '../utils/audioManager';
import { setAudioManagerRef } from '../store/audioState';

const audioManager = new AudioManager();

export default function useAudio() {
    const isInit = useRef(false);

    const initAudio = useCallback(async () => {
        if (isInit.current) {
            // Already initialized — just toggle play/pause
            audioManager.toggle();
            return;
        }

        await audioManager.init();
        isInit.current = true;

        // Share ref with ParticleUniverse/PostFX for per-frame audio data
        setAudioManagerRef(audioManager);

        // Start playing
        await audioManager.play();

        console.log('[Galaxy] 🎵 Audio initialized — playing BGM');
    }, []);

    return { audioManager, initAudio };
}
