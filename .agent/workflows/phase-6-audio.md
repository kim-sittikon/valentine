---
description: "Phase 6: Audio — Synthesized sounds, audio reactive visuals, heartbeat sync"
---

# Phase 6: Audio & Emotional Layer

> scene "มีชีวิต" — เสียง + หัวใจเต้น

## Tasks

- [x] `audioManager.js` — synthesized sounds + AnalyserNode
- [x] `useAudio.js` — audio lifecycle hook
- [ ] Wire audio reactive → `uAudioBass` / `uAudioHigh` uniforms
- [ ] Heartbeat sync → `uBeat` from bass envelope
- [ ] Audio toggle working in browser

## Audio Reactive (Section 21A)

AnalyserNode แบ่ง 3 bands:
- **Bass** (0–400Hz) → particle pulse outward
- **Mid** (400–2kHz) → general energy
- **High** (2kHz+) → sparkle + shimmer

Smooth values ใน useFrame เพื่อไม่ jitter:
```js
material.uniforms.uAudioBass.value += (audioData.bass - current) * 0.15;
```

## Heartbeat Sync (Section 21B)

Love scene → scale heart ตามเสียง heartbeat:
- Bass envelope ≈ heartbeat rhythm
- + subtle color warmth (`uHeartWarmth`)

## Audio Layers per Scene

| Scene | Sound |
|---|---|
| Birth | ambient drone (55Hz) |
| Memory | sparkle (2–5kHz random) |
| Chaos | wind whoosh (bandpass noise) |
| Gravity | bass impact (40Hz) |
| Love | heartbeat (50Hz double thud) |

## Checkpoint

audio on = particles pulse to bass + heart beats with sound
