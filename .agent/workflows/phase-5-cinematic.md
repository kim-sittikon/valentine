---
description: "Phase 5: Cinematic — Depth fog, DOF, chromatic aberration, post-processing, proposal silhouette"
---

# Phase 5: Cinematic & Post-FX

> ดู cinematic เหมือนถ่ายกล้องจริง + proposal silhouette morph

## Tasks

- [x] `PostFX.jsx` — Bloom + Noise + Vignette + CA + DOF + HueSaturation
- [x] Depth fog in `particleFragment.glsl`
- [x] DOF during Love scene (delayed until heart stabilizes)
- [x] Asymmetric CA during warp (smoothstep fade before Love)
- [x] Fine-tune fog density + bloom intensity per scene (`sceneConfig.js`)
- [x] ACES Filmic tone mapping (`Canvas3D.jsx`, exposure: 0.7)
- [x] Per-scene color grading via HueSaturation
- [x] Bloom energy + scroll velocity coupling (capped at 0.5)
- [x] Bloom thresholds raised (0.55–0.8) to prevent additive blending whiteout
- [x] Valentine overlay text rewritten (Thai romantic narrative)
- [x] Text styling: backdrop blur + 3-layer text-shadow for readability
- [x] Proposal silhouette morph (`proposalGenerator.js` + `aTargetC`)
- [x] Scroll-driven proposal formation (stars gather on scroll, not auto)
- [x] Woman short hair (bob style), man kneeling with cape/bouquet
- [x] Void scene fog removed (no dark circle)

## Depth Fog (Section 18A)

Per-scene fog from `sceneConfig.js`:
- Void: `fogDensity: 0.0` (clean stars)
- Memory: `fogDensity: 0.008`
- Love: `fogDensity: 0.006` (lightest)
- `uFogColor` lerped per scene

## Depth of Field (Section 18B)

เปิดเฉพาะ Love scene (localProgress > 0.3):
- `bokehScale`: 2.5 (reduced for perf)
- Smooth fade-in, not abrupt

## Chromatic Aberration (Section 18C)

Asymmetric CA ตอน warp:
- Smoothstep fade 0.55→0.75 scroll
- Dynamic ตาม scroll progress + sine wave

## Proposal Silhouette (NEW)

ดาวค่อยๆ รวมตัวเป็นรูปผู้ชายคุกเข่าให้ดอกไม้ผู้หญิง:
- Canvas 512px → pixel sampling → `aTargetC` buffer attribute
- `uProposalPhase` driven by `scrollProgress` (0→8% = gather)
- Vertex shader: 3-phase morph (proposal → photo → heart)
- Dissolves when entering birth scene

## Tone Mapping & Bloom Fix

- ACES Filmic @ exposure 0.7 (prevents additive blending whiteout)
- Bloom: 0.08–0.3 range, energy coupling 0.15, velocity cap 0.1
- Total bloom capped at 0.5

## Checkpoint

fog ให้มิติ + DOF โฟกัส heart + warp มี cinematic CA + proposal silhouette ตอนเปิด + bloom ไม่ขาวล้น
