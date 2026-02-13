import React from 'react';
import useUniverse from '../store/useUniverse';
import { getSceneByName } from '../config/sceneConfig';

export default function Overlay({ initAudio }) {
    const currentScene = useUniverse((s) => s.currentScene);
    const scrollProgress = useUniverse((s) => s.scrollProgress);
    const scrollVelocity = useUniverse((s) => s.scrollVelocity);
    const localProgress = useUniverse((s) => s.localProgress);
    const fps = useUniverse((s) => s.fps);
    const quality = useUniverse((s) => s.quality);
    const debugMode = useUniverse((s) => s.debugMode);
    const audioEnabled = useUniverse((s) => s.audioEnabled);

    const sceneConfig = getSceneByName(currentScene);
    const title = sceneConfig?.title || '';

    const handleAudioToggle = async () => {
        // First click: init AudioContext (browser requires user gesture)
        if (initAudio) await initAudio();
        useUniverse.getState().toggleAudio();
    };

    return (
        <>
            {/* Scene Title */}
            <div className="overlay">
                <h1 className={`scene-title ${title ? 'visible' : ''}`}>
                    {title}
                </h1>
            </div>

            {/* Progress Bar */}
            <div
                className="progress-bar"
                style={{ width: `${scrollProgress * 100}%` }}
            />

            {/* Audio Toggle */}
            <button
                className="audio-toggle"
                onClick={handleAudioToggle}
                title={audioEnabled ? 'เสียง: เปิด' : 'เสียง: ปิด'}
            >
                {audioEnabled ? '🔊' : '🔇'}
            </button>

            {/* Debug Panel */}
            {debugMode && (
                <div className="debug-panel">
                    <div><span className="label">Scene:</span> {currentScene}</div>
                    <div><span className="label">Scroll:</span> {(scrollProgress * 100).toFixed(1)}%</div>
                    <div><span className="label">Local:</span> {(localProgress * 100).toFixed(1)}%</div>
                    <div><span className="label">Velocity:</span> {scrollVelocity.toFixed(3)}</div>
                    <div><span className="label">FPS:</span> {fps}</div>
                    <div><span className="label">Quality:</span> {quality}</div>
                </div>
            )}
        </>
    );
}
