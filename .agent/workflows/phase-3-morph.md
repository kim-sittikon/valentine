---
description: "Phase 3: Morph System — Stars morph to photo/heart with brightness delay"
---

# Phase 3: Morph System (Stars → Image → Heart)

> particles morph เป็นรูป แล้ว morph เป็นหัวใจ

## Tasks

- [x] `imageSampler.js` — image → positions + brightness data
- [x] `heartGenerator.js` — parametric heart → positions
- [x] `textGenerator.js` — text → particle positions
- [ ] Generate `heart.png` via `generate_image` tool
- [ ] Wire morph targets → `aTarget` + `aBrightness` attributes
- [ ] Verify brightness delay morph in browser

## Brightness Delay Morph (Section 17A)

```glsl
float delay = (1.0 - aBrightness) * 0.35;
float rawProgress = clamp((uMorphProgress - delay) / (1.0 - delay * 0.5), 0.0, 1.0);
// Double smoothstep = ultra smooth organic reveal
float t = rawProgress * rawProgress * (3.0 - 2.0 * rawProgress);
t = t * t * (3.0 - 2.0 * t);
```

**ผลลัพธ์:** pixel สว่างปรากฏก่อน → มืดตามทีหลัง → organic reveal

## Idle Breathing (Section 17B)

3 layers curl noise ให้ภาพ "หายใจ" หลัง morph เสร็จ:
1. Large slow (ปอดใหญ่) — `* 0.25`
2. Medium detail (คลื่น) — `* 0.12`
3. Fine shimmer (ระยิบ) — `* 0.05`

## Checkpoint

scroll 20→45% = stars morph to photo (bright pixels first), then breathe subtly
