---
description: "Phase 1: Foundation — Init project, create core files, particles floating on void"
---

# Phase 1: Foundation & Core

> ไม่ใช่แค่ "particles ลอยได้" — ต้องได้ **โครงที่เสถียร ขยายได้ วัดผลได้**

---

## 🧱 1. Stable Rendering Core

- [x] Canvas mount + clearColor `#0f0c29`
- [x] DPR clamp `[1, max 2]` (range not single value)
- [x] resize handler (debounced, no crash)
- [x] `resize={{ scroll: false, debounce: { resize: 100 } }}`
- [x] ไม่มี console warning — ✅ verified (แค่ favicon.ico 404)
- [x] FPS stable > 55 — ✅ **FPS: 213** on GTX 1060 6GB

---

## 🌌 2. Particle Engine Base (ขยายได้)

- [x] `Points` + `BufferGeometry`
- [x] position, aTarget, aColor, aSize, aDelay, aLife, aRandom, aBrightness = `Float32Array`
- [x] `ShaderMaterial` แยกไฟล์ `.glsl`
- [x] GPU-tier auto-detection → particle count logged
- [x] render 80k particles ลื่น — ✅ **213 FPS @ 80,000 particles**

---

## 🧠 3. State Machine พร้อม

- [x] Zustand: `currentScene` (void/birth/memory/chaos/gravity/love)
- [x] `scrollProgress`, `morphProgress`, `warpStretch`, `heartBeat`
- [x] `audioEnabled`, `quality`, `debugMode`, `fps`
- [x] `shockwave`, `morphPhase`, `morphTargets`
- [x] All actions: setScrollProgress, toggleAudio, setQuality, etc.

---

## 🌫 4. Noise System เสถียร

- [x] Simplex 3D (Ashima Arts, full implementation)
- [x] Curl noise (from simplex derivatives)
- [x] Used in vertex shader: flow + breathing + idle
- [x] ไม่ glitch / NaN — ✅ smooth organic flow confirmed
- [x] smooth ตาม uTime — ✅ particles flow smoothly

---

## 💡 5. Performance Baseline

- [x] FPS counter via `useAdaptiveQuality` (connected as `PerformanceMonitor`)
- [x] GPU renderer string logged in console
- [x] WebGL2 detection + maxTextureSize logged
- [x] Particle count logged
- [x] Adaptive DPR with hysteresis (2x low → reduce, 3x high → increase)

---

## 🏗 6. Clean Architecture

```
Canvas3D
 ├─ ParticleUniverse (Points + BufferGeometry + ShaderMaterial)
 ├─ CameraRig (dolly, shake, orbit)
 ├─ PerformanceMonitor (useAdaptiveQuality)
 └─ PostFX (Bloom + CA + DOF + Noise + Vignette) [conditional]

App.jsx = Canvas3D + Overlay + #scroll-container (no 3D logic)
```

- [x] ไม่มี 3D logic ใน `App.jsx`
- [x] State ใน Zustand, shaders แยก .glsl, utils แยกจาก components

---

## Console Output ที่ควรเห็น

```
[Galaxy] ✅ Render Core Ready
  GPU: ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11)
  WebGL2: true
  DPR: 0.9
  Max Texture: 16384
  PostFX: ON
[Galaxy] Particles: 80,000
```

## Verify — ✅ ALL PASSED (2026-02-13)

```bash
npm run dev
```
1. ✅ Vite compiles (no build errors) — 436 modules, exit 0
2. ✅ Particles visible on purple void
3. ✅ Console: no errors (only favicon.ico 404)
4. ✅ Console: GPU + particle count logged
5. ✅ DevTools FPS: 213 (target > 55)
6. ✅ Resize window → CLS 0.00, no crash
7. ✅ Press backtick → debug panel (Scene/Scroll/FPS/Quality)

## 🎉 PHASE 1 COMPLETE — Ready for Phase 2
