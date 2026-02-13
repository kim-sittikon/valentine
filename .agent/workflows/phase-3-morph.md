---
description: "Phase 3: Morph System — Stars morph to photo/heart with brightness delay"
---

# Phase 3: Morph System (Stars → Photo → Heart)

> particles morph เป็นรูปคู่รัก แล้ว morph เป็นหัวใจ 3D

## Core Tasks (Done)

- [x] `imageSampler.js` — image → positions + brightness data
  - [x] brightness sort (brightest first → smooth reveal)
  - [x] safety clamp: `Math.max(0, Math.min(1, brightness))`
  - [x] Z-depth amplitude ×12 (was ×15, reduced for natural portrait)
  - [x] aspect-ratio-aware: contain-fit (letterbox) + 3D spread per ratio
  - [x] excess particles: scatter as dim dust radius 20-50 (not recycle)
  - [x] sample resolution 350px (was 200→250→350)
  - [x] error handling + console log
- [x] `heartGenerator.js` — parametric heart → positions (3D via `sin(v)√|x|`)
  - [x] density fix: rejection sampling (inverse width) for uniform distribution
  - [x] colors: `#ff758c → #ff7eb3` gradient based on height
- [x] `textGenerator.js` — text → particle positions (exists, not used in morph)
- [x] `ParticleUniverse.jsx` — dual morph buffers
  - [x] `aTargetA` = couple.webp (photo, loaded async via `sampleImage()`)
  - [x] `aTargetB` = parametric heart (from `heartGenerator`)
  - [x] `uMorphPhase` uniform: 0→1 = stars→photo, 1→2 = photo→heart
  - [x] `uEnergy` uniform from `sceneEnergy` (Phase 2 gap fixed)
  - [x] async image load updates geometry buffers (positions, colors, brightness)
- [x] `particleVertex.glsl` — dual-target morph shader
  - [x] `morphT()` helper: brightness delay + double smoothstep
  - [x] two-phase: `tA` (stars→photo), `tB` (photo→heart)
  - [x] `uniform float uEnergy;` — modulates curl noise flow intensity
  - [x] brightness-based size scaling: `gl_PointSize *= 1.0 + aBrightness * 0.4`
  - [x] idle breathing on `currentTarget = mix(aTargetA, aTargetB, tB)`
  - [x] color morph: star(blue-white) → photo(aColor) → heart(pink)
  - [x] anti-blowout: size ×0.4 + alpha 35% during morph
- [x] `particleFragment.glsl` — core boost reduced 0.2 → 0.08
- [x] `useScrollTimeline.js` — two-phase GSAP timeline
  - [x] Phase A (memory 20→45%): `morphPhase` 0→1
  - [x] Phase B (love 75→100%): `morphPhase` 1→2
  - [x] warp stretch at gravity 55→75% (unchanged)
- [x] `useUniverse.js` — `morphPhase` as number 0→2
- [x] `vite build` passes — 5.49s, 0 errors

## ⚠️ Dead Code (ต้องลบ)

| Code | File | สถานะ |
|------|------|-------|
| `uniform float uColorPhase;` | `particleVertex.glsl` L20 | ประกาศแต่ไม่ใช้แล้ว (ใช้ inline color morph แทน) |
| `uColorPhase: { value: 0 }` | `ParticleUniverse.jsx` L135 | uniform ไม่ใช้แล้ว |
| `mat.uniforms.uColorPhase.value = colorPhase;` | `ParticleUniverse.jsx` L162 | set ค่า uniform ที่ไม่ใช้ |
| `colorPhase` destructure | `ParticleUniverse.jsx` L154 | ดึงค่าจาก store แต่ shader ไม่ใช้ |
| `colorPhase: 0` + `colorPhase: p * 5` | `useUniverse.js` L34, L50 | state ในร้านที่ไม่มีใครใช้แล้ว |

## Breathing Amplitudes (Updated)

3 layers curl noise ให้ภาพ "หายใจ" หลัง morph เสร็จ (ลดลง ~40%):
1. Large slow (ปอดใหญ่) — `* 0.15` (was 0.25)
2. Medium detail (คลื่น) — `* 0.07` (was 0.12)
3. Fine shimmer (ระยิบ) — `* 0.03` (was 0.05)
4. `breatheAmp = sin(uTime*1.2) * 0.05` (was 0.08)

## Checkpoint

- [x] `vite build` passes
- [x] console: `[Galaxy] 📷 Photo morph target loaded`
- [x] scroll 20→45% = stars morph to couple photo (bright pixels first) ✅ เห็นรูปและสี
- [x] scroll 75→100% = photo morph to 3D heart ✅ เห็นหัวใจ
- [ ] idle breathing visible → subtle ดู ~3 วินาทีถึงจะสังเกต
- [ ] ลบ dead code (uColorPhase ทั้งระบบ)
