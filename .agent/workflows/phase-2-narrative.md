---
description: "Phase 2: Narrative Engine — GSAP scroll timeline, camera rig, overlay UI"
---

# Phase 2: Enhanced Narrative Engine (v2)

> scroll ควบคุม scene ทั้งหมด + camera move + ระบบ production-grade

## Base Tasks (existing — from before Phase 2 enhancements)

- [x] `useScrollTimeline.js` — GSAP ScrollTrigger ↔ Zustand
- [x] `CameraRig.jsx` — dolly zoom + chaos shake + love orbit
- [x] `Overlay.jsx` — Thai scene titles + progress bar + debug panel
- [x] HTML scroll container (`#scroll-container` 500vh)

## Part A: Foundation ✅ DONE

- [x] Scene config array — `src/config/sceneConfig.js` **[NEW]**
  - [x] 6 scenes with full config (camera/postfx/energy/emotion/title/easing)
  - [x] `getSceneFromProgress()` with hysteresis 1.5%
  - [x] `getLocalProgress()` — per-scene 0→1
  - [x] `lerpSceneValues()` — smooth interpolation helper
  - [x] `getSceneByName()` — lookup helper
- [x] `useUniverse.js` — config-driven scene detection
  - [x] imports from `sceneConfig.js` (no more hardcoded thresholds)
  - [x] `localProgress` state added
  - [x] `sceneEnergy` state added
  - [x] `prevScene` state added
  - [x] `scrollVelocity` state added (setter ready, not yet tracked)
  - [x] `sceneIndex` state added
  - [x] hysteresis guard active via `getSceneFromProgress()`
- [x] Install `leva` — installed (61 packages)
- [x] `vite build` passes — 4.80s, no errors

## Part B: Scroll & Transitions — ⬜ NOT STARTED

- [ ] `useScrollTimeline.js` — add velocity tracking
  - scroll velocity → `setScrollVelocity()` (setter exists, not called yet)
  - one-shot scene transition triggers (`prevScene !== current`)
  - GSAP built-in easings in timeline
- [ ] `App.jsx` — dev kill switch (keys 1-6 → jump to scene)

## Part C: Camera & PostFX — ⬜ NOT STARTED

Files still have hardcoded values:

- [ ] `CameraRig.jsx` — still uses `zMap = { void: 100, birth: 80, ... }`
  - needs: import from config, breathing, clamp, velocity damping
- [ ] `PostFX.jsx` — still uses `{ void: 0.2, birth: 0.3, ... }[currentScene]`
  - needs: import bloom/grain/ca from config

## Part D: UI & Energy — ⬜ NOT STARTED

- [ ] `Overlay.jsx` — still uses `SCENE_TITLES = { void: '', ... }`
  - needs: titles from config, leva debug panel (leva installed but not imported yet)
- [ ] `ParticleUniverse.jsx` — still uses `currentScene === 'void'` checks
  - needs: read `sceneEnergy` → pass as `uEnergy` uniform
- [ ] `useAdaptiveQuality.js` — no energy-aware perf budget yet

## ⚠️ Remaining Hardcoded Values (to be migrated)

| File | Hardcoded | Will become |
|------|-----------|-------------|
| `CameraRig.jsx:15` | `zMap = { void: 100, ... }` | `config.camera.z` |
| `CameraRig.jsx:20` | `if (currentScene === 'chaos')` | `config.camera.shake` |
| `CameraRig.jsx:29` | `if (currentScene === 'love')` | `config.camera.orbitSpeed` |
| `PostFX.jsx:14-16` | `{ void: 0.2, ... }[currentScene]` | `config.bloom` |
| `PostFX.jsx:20` | `currentScene === 'love'` | `config.postfx.dof` |
| `PostFX.jsx:23-28` | `currentScene === 'gravity'` | `config.postfx.ca` |
| `PostFX.jsx:50` | `opacity={0.04}` hardcoded | `config.postfx.grain` |
| `Overlay.jsx:4-11` | `SCENE_TITLES = { ... }` | `config.title` |
| `ParticleUniverse.jsx:124` | `currentScene === 'void'` | energy-based |
| `ParticleUniverse.jsx:137` | `currentScene === 'love'` | energy/config |

## Checkpoint

- [x] `vite build` passes
- [ ] scroll 0→100% = smooth scene transitions + titles ← needs browser verify
- [ ] no flicker at scene boundaries (hysteresis 2%)
- [ ] press 1-6 → jump to scene (dev kill switch)
- [ ] camera breathes subtly + clamp prevents overshoot
- [ ] leva panel shows real-time values
- [ ] fast scroll → effects dampen
- [ ] FPS > 55 throughout
