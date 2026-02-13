import React from 'react';
import useUniverse from '../store/useUniverse';

const SCENE_TITLES = {
    void: '',
    birth: '✦ เมื่อจักรวาลเริ่มต้น...',
    memory: '💫 ทุกอนุภาค คือความทรงจำ',
    chaos: '🌪 แตกสลาย... เพื่อสร้างใหม่',
    gravity: '🚀 แรงดึงดูดที่ไม่อาจหยุด',
    love: '💖 Galaxy of You',
};

export default function Overlay() {
    const currentScene = useUniverse((s) => s.currentScene);
    const scrollProgress = useUniverse((s) => s.scrollProgress);
    const fps = useUniverse((s) => s.fps);
    const quality = useUniverse((s) => s.quality);
    const debugMode = useUniverse((s) => s.debugMode);
    const audioEnabled = useUniverse((s) => s.audioEnabled);

    const title = SCENE_TITLES[currentScene] || '';

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
                onClick={() => useUniverse.getState().toggleAudio()}
                title={audioEnabled ? 'เสียง: เปิด' : 'เสียง: ปิด'}
            >
                {audioEnabled ? '🔊' : '🔇'}
            </button>

            {/* Debug Panel */}
            {debugMode && (
                <div className="debug-panel">
                    <div><span className="label">Scene:</span> {currentScene}</div>
                    <div><span className="label">Scroll:</span> {(scrollProgress * 100).toFixed(1)}%</div>
                    <div><span className="label">FPS:</span> {fps}</div>
                    <div><span className="label">Quality:</span> {quality}</div>
                </div>
            )}
        </>
    );
}
