---
description: "Phase 7: QR Climax + Performance — 4-phase morph ending + adaptive quality"
---

# Phase 7: QR Climax & Performance

> จบแบบหนัง + ลื่นทุกเครื่อง

## Tasks

- [ ] QR Morph Climax — 4-phase flow
- [ ] Multi-target buffer swap (`aTarget` hot-swap)
- [x] `useAdaptiveQuality.js` — hysteresis DPR
- [x] Particle Auto Scale — GPU-tier detection
- [x] WebGL2 Fallback — graceful degrade

## QR Morph Climax (Section 21C)

Love scene sub-phases (scroll 75%–100%):

```
75%–82%:  Warp  ──→ Heart Form (organic morph)
82%–88%:  Heart ──→ Pulse Beat (audio sync, hold shape)
88%–93%:  Heart ──→ Dissolve (gentle scatter, curl noise)
93%–100%: Dust  ──→ QR Code (brightness delay morph)
```

Buffer swap: เปลี่ยน `aTarget` array ตอนเปลี่ยน morphPhase

## Performance Targets

| Device | Particles | DPR | PostFX |
|---|---|---|---|
| High-end GPU | 150k | native (max 2) | Full |
| Mid GPU | 80k | native | Full |
| Low-end GPU | 30k | auto-reduce | Full |
| WebGL1 only | 20k | 1.0 | Disabled |

### Adaptive DPR

- Check ทุก 2 วินาที
- Hysteresis: ต้อง low 2x ก่อนลด, high 3x ก่อนเพิ่ม
- Smooth transition (lerp 0.3)

## Checkpoint

full scroll = cinematic narrative → QR at end + smooth on all devices
