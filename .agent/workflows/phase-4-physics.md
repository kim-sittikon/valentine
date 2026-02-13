---
description: "Phase 4: Physics — Mouse interaction with curl noise field + radial shockwave"
---

# Phase 4: Interaction & Physics (Chaos Scene)

> mouse ดัน particles + nebula swirl + shockwave

## Tasks

- [x] `useMousePhysics.js` — repulsion + curl noise field
- [x] Wire `mouseInteraction` flag per scene → `uMouseActive` uniform
- [x] Shockwave trigger at gravity → love transition
- [x] `ShockwaveRing.jsx` — ring mesh + pointLight pulse
- [x] `CameraRig.jsx` — noise-based micro shake
- [x] Build verified (442 modules, 0 errors)

---

## MUST ADD — ให้ chaos ดูมีชีวิตจริง

### 1️⃣ Mouse Force Falloff แบบ Organic (✅ Implemented)

อย่าใช้ linear falloff → ใช้ smooth exponential:
```glsl
float falloff = exp(-dist * 2.5 / uMouseRadius);
pos += pushDir * falloff * 6.0;
```
- ใกล้ mouse = แรงมาก, ไกล = ละมุน, ไม่มี hard edge

### 2️⃣ Curl Noise ผูกกับ Energy (✅ Implemented)

Swirl แรงสุดตอน chaos (`uEnergy = 1.0`), สงบตอน love:
```glsl
vec3 energySwirl = curlNoise(pos * 0.05 + vec3(uTime * 0.3)) * uEnergy * 2.0;
flow += energySwirl * (1.0 - morphTotal);
```

### 3️⃣ Shockwave ดัน 3D + Z-Wobble (✅ Implemented)

Push ทุกแกน + sin wobble:
```glsl
pos += pushDir * ring * uShockStrength * timeFade * 8.0;
pos.z += sin(dist * 10.0 - uTime * 5.0) * ring * timeFade * 1.5;
```

---

## 💎 CINEMATIC UPGRADE

### 4️⃣ Motion Blur Fake (✅ Implemented)

Particle stretch ตาม velocity:
```glsl
vec3 velocity = pos - prePhysicsPos;
gl_PointSize *= 1.0 + length(velocity) * 2.0;
pos += velocity * min(speed, 3.0);
```

### 5️⃣ Chaos Color Shift (✅ Implemented)

สีเปลี่ยนเป็นม่วง-ชมพูตอน chaos:
```glsl
vec3 chaosColor = vec3(1.0, 0.3, 0.6);
finalColor = mix(finalColor, chaosColor, uEnergy * 0.3 * (1.0 - morphTotal));
```

### 6️⃣ Camera Micro Shake แบบ Noise (✅ Implemented)

ใช้ multi-frequency sin noise (ไม่ใช่ random):
```js
function smoothNoise(t, seed) {
    return Math.sin(t * 1.0 + seed) * 0.5
         + Math.sin(t * 2.3 + seed * 1.7) * 0.3
         + Math.sin(t * 5.1 + seed * 0.3) * 0.2;
}
```

---

## 🚀 GOD-TIER POLISH

### 7️⃣ Shockwave Ring Mesh จริง (✅ Implemented)

`ShockwaveRing.jsx` — dual ring (pink + purple) + pointLight:
- Scale: 0 → 50, opacity: 0.6 → 0
- Additive blending, subtle rotation
- Light intensity flicker

### 8️⃣ Audio Reactive Shockwave (⏭️ Phase 6)

> เก็บไว้ทำตอน Phase 6 — ต้องมี heartbeat sound ก่อน

### 9️⃣ Light Pulse ตอน Chaos (✅ In ShockwaveRing)

pointLight ใน `ShockwaveRing.jsx`:
```jsx
<pointLight color="#ff4fa3" intensity={timeFade * strength * 5.0} distance={80} />
```

---

## Curl Noise Field (Section 19A)

ตอน chaos ไม่ random explode — particles ไหลตาม curl noise field เหมือน nebula:
- Repulsion force via exponential falloff
- Curl noise × energy (chaos only)
- `curlFade` = ยิ่งใกล้ mouse ยิ่ง swirl แรง

## Radial Shockwave (Section 19B)

ตอน transition gravity → love:
```js
useUniverse.getState().triggerShockwave(new THREE.Vector3(0, 0, 0), 1.0);
```
- Gaussian ring profile ขยายตัว (3D push + Z wobble)
- Fade out ใน 2 วินาที
- Perpendicular wobble + tangent displacement

## Checkpoint

chaos scene = mouse scatters particles with nebula flow (organic falloff + curl×energy) + color shift to magenta + motion blur + shockwave ring mesh at gravity→love + noise camera shake

---

## 🆕 Recently Added Features

### 1️⃣ Energy Heatmap 🌡️ (✅ Implemented)

ทำให้สีผูกกับ **ระยะห่างจาก mouse** ไม่ใช่ global color shift:
```glsl
float heat = clamp(interactionForce * 1.5, 0.0, 1.0);
vec3 coolColor = vec3(1.0);            // star white
vec3 hotColor  = vec3(1.0, 0.4, 0.1);  // ember orange
vec3 finalColor = mix(coolColor, hotColor, heat);
```
- ใกล้ mouse = ร้อนแดงส้ม
- ไกล = ขาวปกติ
- Fragment: `gl_FragColor.rgb *= 1.0 + heat * 1.5;` → glow boost

**ไฟล์:** `particleVertex.glsl` (+ varying), `particleFragment.glsl`

### 2️⃣ Mouse Velocity Influence 🌪️ (✅ Implemented)

เพิ่ม velocity ให้ mouse → กวัดเร็ว = swirl แรง:
```js
// JS: คำนวณ velocity
mouseVelocity = mousePos.clone().sub(prevMousePos);
prevMousePos.copy(mousePos);
```
```glsl
// Shader: velocity → force amplifier
uniform vec2 uMouseVelocity;
float velocityMag = length(uMouseVelocity);
float velocityBoost = smoothstep(0.0, 0.5, velocityMag);
force *= 1.0 + velocityBoost * 2.0;
```
- Mouse นิ่ง = แรงค่อย ๆ หาย
- กวัดแกว่งเร็ว = พายุหมุน

**ไฟล์:** `Canvas3D.jsx` (compute velocity), `ParticleUniverse.jsx` (uniform), `particleVertex.glsl`

### 3️⃣ Interaction Size Pulse ✨ (✅ Implemented, clamp 3x)

Particle ใกล้ mouse ใหญ่ขึ้น:
```glsl
float sizeBoost = 1.0 + heat * 2.0;
gl_PointSize *= sizeBoost;
```
- ต้อง clamp ไม่งั้นจะเป็น blob
- Distance attenuation ทำอยู่แล้ว (`300.0 / -mvPosition.z`)

**ไฟล์:** `particleVertex.glsl`

### 🎬 Director Upgrade: Heat Dissipation

หลังโดนกวน → heat ค่อย ๆ จางเหมือนอุณหภูมิลด:
```glsl
heat *= exp(-uDeltaTime * 2.0);
```
- ไม่งั้นจะดูเหมือน color ติดค้าง
- ต้องเก็บ heat state ต่อ particle (อาจใช้ varying หรือ attribute)

---

## 📝 สรุปสิ่งที่ทำไปแล้ว

| # | ฟีเจอร์ | ไฟล์ที่แก้ | สถานะ |
|---|---------|-----------|-------|
| 1 | Mouse Organic Falloff (`exp()`) | `particleVertex.glsl` Sec 5.5 | ✅ |
| 2 | Curl Noise × Energy | `particleVertex.glsl` Sec 2 | ✅ |
| 3 | Shockwave 3D + Z-Wobble | `particleVertex.glsl` Sec 8 | ✅ |
| 4 | Motion Blur Stretch | `particleVertex.glsl` Sec 13 | ✅ |
| 5 | Chaos Color Shift (magenta) | `particleVertex.glsl` Sec 9 | ✅ |
| 6 | Noise Camera Shake | `CameraRig.jsx` | ✅ |
| 7 | Shockwave Ring Mesh | `ShockwaveRing.jsx` (ใหม่) | ✅ |
| 8 | Audio Reactive | — | ⏭️ Phase 6 |
| 9 | Light Pulse | `ShockwaveRing.jsx` | ✅ |
| — | `uMouseActive` uniform | `ParticleUniverse.jsx` | ✅ |
| — | Shockwave trigger | `useScrollTimeline.js` | ✅ |
| — | Pointer events wiring | `Canvas3D.jsx` | ✅ |

**Build:** ผ่าน (442 modules, 5.84s, 0 errors)

---

## 🧪 วิธีเทส Phase 4 (ละเอียด)

> เปิด dev server: `npm run dev` → เข้า `localhost:5173`
> กดปุ่ม `` ` `` (backtick) เพื่อเปิด debug panel (แสดง scene, scroll%, FPS)

---

### เทส 1: Mouse Repulsion (ผลักอนุภาค)

**ขั้นตอน:**
1. เปิดหน้าเว็บ → scroll ไปจนถึง **45-55%** (Scene: `chaos`)
2. ดู debug panel → ต้องเห็น `Scene: chaos`
3. เลื่อนเมาส์ไปใกล้กลุ่ม particles
4. สังเกต: particles ต้อง **ถูกผลักออกจากเมาส์**
5. เลื่อนเมาส์ **ช้า ๆ** → ผลักแบบนุ่มนวล
6. ดู **ขอบการผลัก** → ต้องไม่มี "เส้นตัดชัด" (exponential falloff)

**ถูก ✅** particles ค่อย ๆ เคลื่อนออก ไม่มี hard edge
**ผิด ❌** particles ไม่ขยับเลย หรือ ขยับแบบ snap/กระตุก

---

### เทส 2: Curl Noise Swirl (หมุนวน)

**ขั้นตอน:**
1. อยู่ใน chaos scene (45-55%)
2. ดู particles ทั้งจอ **โดยไม่ต้องขยับเมาส์**
3. สังเกต: particles ต้อง **ไหลวนเนียน ๆ** เหมือน nebula
4. เปรียบเทียบกับ scene อื่น:
   - chaos: swirl แรง (energy = 1.0)
   - love: สงบลง (energy = 0.5)
   - void: แทบไม่ swirl (energy = 0.2)

**ถูก ✅** chaos swirl หนัก, love สงบ
**ผิด ❌** swirl เท่ากันทุก scene

---

### เทส 3: Chaos Color Shift (สีเปลี่ยน)

**ขั้นตอน:**
1. เริ่มที่ void scene (0%) → สังเกตสี particles = **ขาว/ฟ้า**
2. Scroll ไป chaos (45%) → สีต้องค่อย ๆ เปลี่ยนเป็น **ม่วง-ชมพู**
3. Scroll ต่อไป love (75%) → สีเปลี่ยนเป็น **ชมพู-แดง (heart)**

**ถูก ✅** สีค่อย ๆ transition เนียน ตาม scene
**ผิด ❌** สีขาวตลอด หรือ สี snap ทันที

---

### เทส 4: Motion Blur (อนุภาคยืด)

**ขั้นตอน:**
1. อยู่ใน chaos scene (45-55%)
2. ขยับเมาส์ **เร็ว ๆ** ผ่านกลุ่ม particles
3. สังเกต: particles ที่ถูกดัน → ต้อง **ยืดยาวขึ้น**
4. พอ particles สงบ → กลับเป็นจุดกลมปกติ

**ถูก ✅** particles ยืดตอนเคลื่อนเร็ว กลมตอนนิ่ง
**ผิด ❌** ไม่เห็นความแตกต่าง หรือ particles ใหญ่ตลอดเวลา

---

### เทส 5: Camera Shake (กล้องสั่น)

**ขั้นตอน:**
1. Scroll ไป chaos scene (45-55%)
2. หยุดเมาส์ แล้วดูจอนิ่ง ๆ
3. สังเกต: กล้องต้อง **สั่นเล็กน้อย** (organic ไม่ jitter)
4. Scroll ไป love scene (75%) → กล้อง **หยุดสั่น** (shake = 0)

**ถูก ✅** สั่นเบา ๆ organic, หยุดเมื่อเปลี่ยน scene
**ผิด ❌** กล้องนิ่งตอน chaos หรือ jitter แรง

---

### เทส 6: Shockwave Ring (วงแหวนพลังงาน)

**ขั้นตอน:**
1. Scroll มาถึงก่อน **75%** (gravity scene ช่วงปลาย)
2. Scroll ผ่าน **75%** เข้า love → **ดูตรงกลางจอ**
3. สังเกต:
   - **วงแหวนสีชมพู** ขยายตัวจากศูนย์กลาง
   - มี **วงที่ 2 สีม่วง** ตามมาเล็กน้อย
   - **แสง flash** สว่างวูบ แล้วค่อย ๆ จาง
   - รวม ≈ 2 วินาที แล้วหายสนิท
4. เช็ค console → ต้องเห็น `[Galaxy] 💥 Shockwave triggered!`

**เทสซ้ำ:** scroll กลับขึ้นไป gravity แล้วลงมา love อีก → ต้อง trigger อีกรอบ

**ถูก ✅** ring ขยาย + flash + จางภายใน 2 วิ
**ผิด ❌** ไม่เห็น ring หรือ ring ค้าง

---

### เทส 7: Shockwave Particles (อนุภาคถูกคลื่นดัน)

**ขั้นตอน:**
1. ทำเหมือนเทส 6 (scroll ผ่าน gravity → love)
2. สังเกต **particles** (ไม่ใช่ ring):
   - particles ต้อง **ถูกดันออก** ตามทิศ shockwave
   - เห็น **Z-wobble** (สั่นขึ้น-ลงเหมือนคลื่น)
   - ค่อย ๆ จาง ≈ 2 วินาที

**ถูก ✅** particles กระเพื่อมเป็นคลื่น 3D
**ผิด ❌** particles นิ่งตอน shockwave

---

### เทส 8: Performance (FPS)

**ขั้นตอน:**
1. เปิด debug panel (กด `` ` ``)
2. อยู่ chaos scene + ขยับเมาส์ตลอดเวลา
3. ดู FPS → ต้อง **> 50**

**ถูก ✅** FPS > 50 (physics ทำ GPU หมด)
**ผิด ❌** FPS < 30 → อาจต้องลด particle count

---

## 🐛 Debug Tips

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|--------|
| Mouse ไม่ผลัก | `uMouseActive` ไม่ set | console ต้องมี `🌪 Mouse interaction active` |
| ไม่เห็น ring | ไม่ได้ wire | เช็ค `Canvas3D.jsx` มี `<ShockwaveRing />` |
| shockwave ไม่ trigger | event ไม่ fire | console ต้องมี `💥 Shockwave triggered!` |
| สีไม่เปลี่ยน | `uEnergy` ไม่ update | ดู debug panel Scene ตรงกับที่คาด |
| Particles หาย | shader error | เปิด DevTools Console ดู WebGL error |
| Ring ค้าง | `advanceShockwave` ไม่เรียก | เช็ค `ParticleUniverse.jsx` |

---

### เทส 9: Energy Heatmap (สีตามระยะ mouse)

**ขั้นตอน:**
1. อย่ใน chaos scene (45-55%)
2. เลื่อนเมาส **ไปใกล้** กลุ่ม particles
3. ใกล้เมาส = **ส้มร้อน (ember orange)** + สว่างกว่าปกติ
4. ห่างจากเมาส = **สีปกติ** (ขาว/ชมพ)
5. เลื่อนเมาสออกไกล → สีกลับเปนปกติ smooth

**ถก ✅** ใกล้ = ส้มร้อน + glow, ไกล = ปกติ
**ผิด ❌** สีเหมือนกันทั้งจอ

---

### เทส 10: Mouse Velocity (กวัดเรว = พายุ)

**ขั้นตอน:**
1. อย่ใน chaos scene (45-55%)
2. **เมาสช้า** ผ่าน particles → ผลักเบา swirl น้อย
3. **เมาสเรว** ผ่าน particles → ผลักแรง 2-3x swirl วุ่นวาย
4. **หยุดนิ่ง** → แรงค่อย ๆ ลด

**ถก ✅** เรว = พายุ, ช้า = ลมเบา
**ผิด ❌** แรงเท่ากันไม่ว่าเรวช้า

---

### เทส 11: Size Pulse (particles ใกล้ mouse ให่ขึ้น)

**ขั้นตอน:**
1. อย่ใน chaos scene (45-55%)
2. เลื่อนเมาสใกล้ particles → ต้อง **ให่ขึ้น 2-3x**
3. ไกลเมาส = ขนาดปกติ
4. ตรวจว่า **ไม่เปน blob** (clamp 3x)

**ถก ✅** ใกล้ = ให่ชัดเจน ไม่ blob
**ผิด ❌** ขนาดเท่ากันหมด หรือ blob
