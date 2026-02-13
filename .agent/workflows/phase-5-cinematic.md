---
description: "Phase 5: Cinematic — Depth fog, DOF, chromatic aberration, post-processing"
---

# Phase 5: Cinematic & Post-FX

> ดู cinematic เหมือนถ่ายกล้องจริง

## Tasks

- [x] `PostFX.jsx` — Bloom + Noise + Vignette + CA + DOF
- [x] Depth fog in `particleFragment.glsl`
- [x] DOF during Love scene
- [x] Asymmetric CA during warp
- [ ] Fine-tune fog density + bloom intensity per scene

## Depth Fog (Section 18A)

Exponential squared fog — ไกลออกไปจาง:
- `uFogDensity`: 0.012
- `uFogColor`: #0f0c29 (deep void — NOT black)
- Alpha ก็ลดตามระยะ

## Depth of Field (Section 18B)

เปิดเฉพาะ Love scene:
- `focusDistance`: 0.02
- `focalLength`: 0.05
- `bokehScale`: 4.0
- ทำให้โฟกัสที่ heart/QR — พื้นหลัง blur

## Chromatic Aberration (Section 18C)

Asymmetric CA ตอน warp — anamorphic lens feel:
- Horizontal > Vertical offset
- Dynamic ตาม scroll progress

## Checkpoint

fog ให้มิติ + DOF โฟกัส heart + warp มี cinematic CA
