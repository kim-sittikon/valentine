/**
 * audioState.js — Shared audio state module.
 * Avoids circular dependency between useAudio, ParticleUniverse, and PostFX.
 */

/** @type {import('../utils/audioManager').AudioManager | null} */
let _audioManagerRef = null;

export function setAudioManagerRef(am) {
    _audioManagerRef = am;
}

export function getAudioManagerRef() {
    return _audioManagerRef;
}
