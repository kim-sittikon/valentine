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

## Part B: Scroll & Transitions — ✅ DONE

- [x] `useScrollTimeline.js` — velocity tracking
  - normalized velocity: (progress - prev) / deltaTime + clamp ±2
  - ref-based (no re-renders): `prevProgressRef`, `prevTimeRef`
- [x] `useScrollTimeline.js` — one-shot scene transition triggers
  - `prevSceneRef` = useRef (not store) → prevents double fire
  - fires `handleSceneTransition()` with enriched log
  - log format: `[Galaxy] 🎬 Scene: X → Y (event: ...) | local: ... | vel: ... | energy: ...`
- [x] `useScrollTimeline.js` — GSAP config-driven easings
  - morph ease from `sceneConfig.memory.easing`
  - warp ease from `sceneConfig.gravity.easing`
  - timeline start positions from `config.range[0]`
- [x] `App.jsx` — dev kill switch (keys 1-6 → jump to scene)
  - `ScrollTrigger.update()` after `scrollTo` (prevents GSAP desync)
  - key 0 → reset to top
  - console log: `[Galaxy] ⚡ Dev jump → scene: X (scroll: Y%)`
- [x] `Overlay.jsx` — debug panel enhanced
  - added: `scrollVelocity`, `localProgress`
- [x] `vite build` passes — 437 modules, 5.59s, 0 errors

## Part C: Camera & PostFX — ✅ DONE

- [x] `CameraRig.jsx` — config-driven camera
  - reads `camera.z`, `camera.shake`, `camera.breathing`, `camera.orbitSpeed` from sceneConfig
  - removed hardcoded `zMap` and `if (currentScene === 'chaos'/'love')` chains
- [x] `PostFX.jsx` — config-driven post-processing
  - reads `bloom`, `postfx.grain`, `postfx.ca`, `postfx.dof` from sceneConfig
  - removed hardcoded `{ void: 0.2, birth: 0.3, ... }` bloom map

## Part D: UI & Energy — ✅ DONE

- [x] `Overlay.jsx` — titles from `sceneConfig.title` via `getSceneByName()`
  - removed hardcoded `SCENE_TITLES` map
  - debug panel: added `scrollVelocity` + `localProgress`
- [x] `ParticleUniverse.jsx` — `uEnergy` uniform from `sceneEnergy`
  - smooth lerp: `uEnergy += (sceneEnergy - uEnergy) * 0.05`
- [ ] `useAdaptiveQuality.js` — energy-aware perf budget (deferred to Phase 7)
- [ ] Leva debug panel integration (deferred — debug panel in Overlay is sufficient)

## Bugfixes

- [x] `index.css` — `pointer-events: none` on `.canvas-wrapper` → scroll works

## Checkpoint

- [x] `vite build` passes — 437 modules, 6.79s, 0 errors
- [ ] scroll 0→100% = smooth scene transitions + titles ← needs browser verify
- [ ] no flicker at scene boundaries (hysteresis 1.5%)
- [x] press 1-6 → jump to scene (dev kill switch) — console logs confirmed
- [x] camera reads config values (z, breathing, shake, orbit)
- [ ] FPS > 55 throughout ← needs browser verify

