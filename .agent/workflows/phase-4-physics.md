---
description: "Phase 4: Physics — Mouse interaction with curl noise field + radial shockwave"
---

# Phase 4: Interaction & Physics (Chaos Scene)

> mouse ดัน particles + nebula swirl + shockwave

## Tasks

- [x] `useMousePhysics.js` — repulsion + curl noise field
- [ ] Wire `mouseInteraction` flag per scene in `ParticleUniverse.jsx`
- [ ] Verify shockwave at gravity → love transition

## Curl Noise Field (Section 19A)

ตอน chaos ไม่ random explode — particles ไหลตาม curl noise field เหมือน nebula:
- Repulsion force * 0.4 (ลดลงจากเดิม)
- Curl noise * 15.0 (เพิ่ม nebula swirl)
- `curlFade` = ยิ่งใกล้ mouse ยิ่ง swirl แรง

## Radial Shockwave (Section 19B)

ตอน transition gravity → love:
```js
useUniverse.getState().triggerShockwave(new THREE.Vector3(0, 0, 0), 1.0);
```
- Gaussian ring profile ขยายตัว
- Fade out ใน 2 วินาที
- Perpendicular wobble ทำให้คลื่นดูจริง

## Checkpoint

chaos scene = mouse scatters particles with nebula flow + shockwave ring at climax
