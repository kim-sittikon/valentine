---
description: "Phase 2: Narrative Engine — GSAP scroll timeline, camera rig, overlay UI"
---

# Phase 2: Enhanced Narrative Engine

> scroll ควบคุม scene ทั้งหมด + camera move + ระบบ production-grade

## Base Tasks (existing)

- [x] `useScrollTimeline.js` — GSAP ScrollTrigger ↔ Zustand
- [x] `CameraRig.jsx` — dolly zoom + chaos shake + love orbit
- [x] `Overlay.jsx` — Thai scene titles + progress bar + debug panel
- [x] HTML scroll container (`#scroll-container` 500vh)

## Enhanced Tasks (10 Enhancements)

- [ ] Scene config array — `src/config/sceneConfig.js` **[NEW]**
- [ ] Easing function layer — `src/utils/easings.js` **[NEW]**
- [ ] Scene transition hook — `src/hooks/useSceneTransition.js` **[NEW]**
- [ ] Motion energy controller — modify `useUniverse.js` + `ParticleUniverse.jsx`
- [ ] Debug telemetry — enhance `Overlay.jsx` debug panel
- [ ] PostFX per scene — modify `PostFX.jsx` to read from config
- [ ] Boundary hysteresis — phase guard 2% in `useUniverse.js`
- [ ] Scroll velocity awareness — modify `useScrollTimeline.js`
- [ ] Camera breathing + damping — modify `CameraRig.jsx`
- [ ] Emotional arc — energy map through config

## Scene Map (with Emotional Arc)

| Scene | Scroll % | Camera Z | Bloom | Energy | Emotion | Event |
|---|---|---|---|---|---|---|
| **Void** | 0–10% | 100 | 0.2 | 0.2 Low | Calm | silence |
| **Birth** | 10–20% | 100→60 | 0.3 | 0.4 Rising | Wonder | particles fade in |
| **Memory** | 20–45% | 60→40 | 0.5 | 0.6 Stable | Warm | morph to image |
| **Chaos** | 45–55% | 40 | 0.8 | **1.0 Peak** | Intense | mouse interaction |
| **Gravity** | 55–75% | 40→5 | 1.5 | 0.3 Drop ↓ | Suspense | warp stretch |
| **Love** | 75–100% | 30, orbit | 0.8 | 0.5 Glow | Intimate | heart + QR |

## Architecture

```
sceneConfig.js (single source of truth)
  ├── useUniverse.js (reads ranges + hysteresis)
  ├── CameraRig.jsx (reads camera config + breathing)
  ├── PostFX.jsx (reads postfx config per scene)
  ├── Overlay.jsx (reads titles + debug data)
  ├── ParticleUniverse.jsx (reads energy level)
  └── useScrollTimeline.js (reads easing curves + velocity)

useSceneTransition.js (fires on scene change)
  └── triggers: sound, shockwave, bloom shift, morph
```

## Checkpoint

- [ ] scroll 0→100% = camera moves through 6 scenes + Thai titles appear/fade
- [ ] no flicker at scene boundaries (hysteresis)
- [ ] camera breathes subtly in all scenes
- [ ] debug panel shows: scene, localProgress, cameraZ, bloom, energy, velocity
- [ ] fast scroll → effects dampen
- [ ] FPS > 55 throughout
