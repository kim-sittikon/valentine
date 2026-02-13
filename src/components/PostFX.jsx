import {
    EffectComposer, Bloom, Noise, Vignette,
    ChromaticAberration, DepthOfField,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import useUniverse from '../store/useUniverse';

export default function PostFX() {
    const warpStretch = useUniverse((s) => s.warpStretch);
    const currentScene = useUniverse((s) => s.currentScene);
    const scrollProgress = useUniverse((s) => s.scrollProgress);

    const bloomIntensity = {
        void: 0.2, birth: 0.3, memory: 0.5,
        chaos: 0.8, gravity: 1.5, love: 0.8,
    }[currentScene] || 0.5;

    // DOF only during Love scene
    const isLove = currentScene === 'love';

    // Asymmetric CA during warp
    const caX = currentScene === 'gravity'
        ? warpStretch * 0.008 + Math.sin(scrollProgress * Math.PI) * 0.002
        : warpStretch * 0.003;
    const caY = currentScene === 'gravity'
        ? warpStretch * 0.005
        : warpStretch * 0.003;

    return (
        <EffectComposer>
            <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                mipmapBlur
            />
            {isLove && (
                <DepthOfField
                    focusDistance={0.02}
                    focalLength={0.05}
                    bokehScale={4.0}
                />
            )}
            <ChromaticAberration
                offset={new Vector2(caX, caY)}
                blendFunction={BlendFunction.NORMAL}
            />
            <Noise
                opacity={0.04}
                blendFunction={BlendFunction.OVERLAY}
            />
            <Vignette
                offset={0.3}
                darkness={0.9}
                blendFunction={BlendFunction.NORMAL}
            />
        </EffectComposer>
    );
}
