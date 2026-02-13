---
description: "Phase 6: Audio — MP3 background music + audio-reactive visuals"
---

# Phase 6: Audio & Emotional Layer ✅

> เพลงจริง + particles react ตาม frequency

## Tasks

- [x] `audioManager.js` — MP3 playback via `new Audio()` + AnalyserNode
- [x] `audioState.js` — shared module (no circular deps)
- [x] `useAudio.js` — init + play/pause toggle
- [x] `App.jsx` — wire `useAudio()` + pass `initAudio` to Overlay
- [x] `Overlay.jsx` — audio button calls `initAudio()` (browser gesture)
- [x] `ParticleUniverse.jsx` — real audio data → shader uniforms
- [x] `PostFX.jsx` — audio-driven bloom (chaos/gravity)
- [x] `particleVertex.glsl` — `exp(-uBeat*5)` beat pulse
- [x] Place `bgm.mp3` in `public/music/`

// turbo-all

## How It Works

```
Audio Graph:
new Audio('bgm.mp3') → MediaElementSource → AnalyserNode → speakers

Visual Coupling:
FFT → fast/slow envelope → punch/beatPhase
→ uAudioBass (particle expand)
→ uAudioHigh (sparkle)
→ uBeat (heart pulse)
→ bloom boost (chaos)
```

## Setup

1. Place MP3 in `public/music/bgm.mp3`
2. Click 🔇 button → music plays + visuals react
