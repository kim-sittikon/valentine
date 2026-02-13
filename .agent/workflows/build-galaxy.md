---
description: Complete technical architecture and build workflow for Galaxy of You — a studio-grade React Three Fiber particle narrative experience for Valentine's Day.
---

# 🎬 Galaxy of You — Technical Architecture & Build Workflow

---

## 1. Tech Stack (Final)

```
Core:         React 18 + Vite
3D Engine:    Three.js + @react-three/fiber (R3F)
3D Helpers:   @react-three/drei
Post-FX:      @react-three/postprocessing (Bloom, Noise, Vignette, ChromaticAberration)
Motion:       GSAP + ScrollTrigger (narrative scroll timeline)
State:        Zustand (scene state machine)
Shader:       Custom GLSL (curl noise, morph, glow — all hand-written)
Audio:        Web Audio API (native, synthesized sounds)
Fonts:        Google Fonts (Playfair Display + Sarabun)
```

### Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "@react-three/postprocessing": "^2.16.0",
    "postprocessing": "^6.34.0",
    "gsap": "^3.12.0",
    "zustand": "^4.4.0"
  }
}
```

---

## 2. Project Structure

```
d:\Valentine\
├── index.html
├── package.json
├── vite.config.js
│
├── public/
│   └── heart.png                    # Generated morph target image
│
├── src/
│   ├── main.jsx                     # ReactDOM entry
│   ├── App.jsx                      # Root: ScrollContainer + Canvas3D + Overlay
│   ├── index.css                    # Global styles, palette, fonts, resets
│   │
│   ├── store/
│   │   └── useUniverse.js           # Zustand: scene state, scroll, morph, quality
│   │
│   ├── components/
│   │   ├── Canvas3D.jsx             # <Canvas> + lights + post-fx + camera
│   │   ├── ParticleUniverse.jsx     # Core: 80K particles + ShaderMaterial
│   │   ├── CameraRig.jsx           # Cinematic camera (dolly, shake, orbit)
│   │   ├── PostFX.jsx              # EffectComposer: Bloom, Vignette, Grain, CA
│   │   └── Overlay.jsx             # HTML UI: scene titles, progress, debug, audio
│   │
│   ├── shaders/
│   │   ├── particleVertex.glsl      # Vertex: curl noise + morph + warp + mouse
│   │   ├── particleFragment.glsl    # Fragment: soft circle + glow + alpha
│   │   └── noise.glsl               # 3D Simplex noise + curl noise functions
│   │
│   ├── utils/
│   │   ├── imageSampler.js          # Image → canvas → pixel → 3D positions
│   │   ├── heartGenerator.js        # Parametric heart equation → positions
│   │   ├── textGenerator.js         # Canvas text render → particle positions
│   │   └── audioManager.js          # Web Audio API: drone, sparkle, whoosh, heartbeat
│   │
│   └── hooks/
│       ├── useScrollTimeline.js     # GSAP ScrollTrigger ↔ Zustand sync
│       ├── useMousePhysics.js       # Raycaster + repulsion/attraction/shockwave
│       ├── useAdaptiveQuality.js    # FPS monitor → auto DPR/quality adjust
│       └── useAudio.js              # Audio context lifecycle + controls
```

---

## 3. Zustand State Machine — `useUniverse.js`

```js
import { create } from 'zustand';

const useUniverse = create((set, get) => ({
  // ─── Scene State ───
  currentScene: 'void',
  // Possible: 'void' | 'birth' | 'memory' | 'chaos' | 'gravity' | 'love'

  // ─── Animation Progress ───
  scrollProgress: 0,       // 0–1 (mapped from window scroll)
  morphProgress: 0,        // 0–1 (particles → image)
  warpStretch: 0,          // 0–3 (z-axis particle stretch)
  heartBeat: 0,            // 0–1 (heart pulse cycle)

  // ─── Interaction Flags ───
  mouseInteraction: false,  // Only true during chaos scene
  mousePos: { x: 0, y: 0 },
  shockwave: null,          // { origin: vec3, time: 0 } or null

  // ─── System ───
  audioEnabled: false,
  debugMode: false,
  quality: 'high',          // 'high' | 'medium' | 'low'
  fps: 60,

  // ─── Color Progress ───
  colorPhase: 0,           // 0–4 mapped to palette transitions

  // ─── Actions ───
  setScrollProgress: (p) => {
    const scene =
      p < 0.10 ? 'void' :
      p < 0.20 ? 'birth' :
      p < 0.45 ? 'memory' :
      p < 0.55 ? 'chaos' :
      p < 0.75 ? 'gravity' : 'love';

    set({
      scrollProgress: p,
      currentScene: scene,
      mouseInteraction: scene === 'chaos',
      colorPhase: p * 5,
    });
  },

  setMorphProgress: (v) => set({ morphProgress: v }),
  setWarpStretch: (v) => set({ warpStretch: v }),
  setHeartBeat: (v) => set({ heartBeat: v }),
  setMousePos: (pos) => set({ mousePos: pos }),
  triggerShockwave: (origin) => set({ shockwave: { origin, time: 0 } }),
  clearShockwave: () => set({ shockwave: null }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  toggleDebug: () => set((s) => ({ debugMode: !s.debugMode })),
  setQuality: (q) => set({ quality: q }),
  setFps: (f) => set({ fps: f }),
}));

export default useUniverse;
```

---

## 4. Scene Director — Scroll → Scene Mapping

### GSAP ScrollTrigger Setup (in `useScrollTimeline.js`)

```js
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useUniverse from '../store/useUniverse';

gsap.registerPlugin(ScrollTrigger);

export default function useScrollTimeline() {
  useEffect(() => {
    // Main scroll → progress mapping
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,              // Smooth 0.5s delay
      onUpdate: (self) => {
        useUniverse.getState().setScrollProgress(self.progress);
      }
    });

    // Per-scene GSAP timelines for morph, warp, etc.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      }
    });

    // Scene 2: Morph progress (20% → 45%)
    tl.to(useUniverse.getState(), {
      morphProgress: 1,
      duration: 0.25,  // 25% of scroll
      ease: 'power2.inOut',
      onUpdate: () => {
        useUniverse.getState().setMorphProgress(
          useUniverse.getState().morphProgress
        );
      }
    }, 0.2);  // starts at 20%

    // Scene 4: Warp stretch (55% → 75%)
    tl.to(useUniverse.getState(), {
      warpStretch: 3,
      duration: 0.2,
      ease: 'power3.in',
      onUpdate: () => {
        useUniverse.getState().setWarpStretch(
          useUniverse.getState().warpStretch
        );
      }
    }, 0.55);

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);
}
```

### Scene Parameters Table

| Scene | Scroll % | morphProgress | warpStretch | Camera Z | Bloom | Audio Layer |
|---|---|---|---|---|---|---|
| **Void** | 0–10% | 0 | 0 | 100 | 0.2 | silence |
| **Birth** | 10–20% | 0 | 0 | 100→60 | 0.3 | ambient drone fade in |
| **Memory** | 20–45% | 0→1 | 0 | 60→40 | 0.5 | sparkle layer |
| **Chaos** | 45–55% | 1 (hold) | 0 | 40 | 0.8 | swoosh on scatter |
| **Gravity** | 55–75% | — | 0→3 | 40→5 | 1.5 | bass impact |
| **Love** | 75–100% | new targets | 0 | 30, orbit | 0.8 | heartbeat |

---

## 5. Particle System — `ParticleUniverse.jsx`

### Architecture
```
<Points>
  └── <BufferGeometry>
  │     ├── position     (Float32 ×3)  — current XYZ
  │     ├── aTarget      (Float32 ×3)  — morph target
  │     ├── aColor       (Float32 ×3)  — per-particle RGB
  │     ├── aSize        (Float32 ×1)  — point size
  │     ├── aDelay       (Float32 ×1)  — stagger delay (0–1)
  │     ├── aVelocity    (Float32 ×3)  — physics velocity
  │     ├── aLife        (Float32 ×1)  — opacity/life
  │     └── aRandom      (Float32 ×3)  — noise seed
  │
  └── <ShaderMaterial>
        ├── vertex:   particleVertex.glsl
        ├── fragment: particleFragment.glsl
        └── uniforms:
              ├── uTime           (float)
              ├── uMorphProgress  (float)  — from Zustand
              ├── uWarpStretch    (float)  — from Zustand
              ├── uMouse          (vec2)   — normalized mouse
              ├── uMouseRadius    (float)  — repulsion radius
              ├── uPointScale     (float)  — adaptive sizing
              ├── uColorPhase     (float)  — palette transition
              ├── uBeat           (float)  — audio beat pulse
              └── uResolution     (vec2)   — viewport size
```

### Particle Init (CPU)
```js
const PARTICLE_COUNT = 80000;

function initParticles() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const targets = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const delays = new Float32Array(PARTICLE_COUNT);
  const randoms = new Float32Array(PARTICLE_COUNT * 3);
  const lives = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Random sphere distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.33) * 50; // cube root for uniform volume

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Initial color: white star (#ffffff)
    colors[i * 3]     = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;

    sizes[i] = Math.random() * 2 + 0.5;
    delays[i] = Math.random();
    lives[i] = 0; // Start invisible, fade in during Birth

    randoms[i * 3]     = Math.random();
    randoms[i * 3 + 1] = Math.random();
    randoms[i * 3 + 2] = Math.random();
  }

  return { positions, targets, colors, sizes, delays, randoms, lives };
}
```

### Per-Frame Update (in useFrame)
```js
useFrame((state, delta) => {
  const { scrollProgress, currentScene, mousePos } = useUniverse.getState();

  // 1. Update uniforms
  material.uniforms.uTime.value = state.clock.elapsedTime;
  material.uniforms.uMorphProgress.value = useUniverse.getState().morphProgress;
  material.uniforms.uWarpStretch.value = useUniverse.getState().warpStretch;

  // 2. Scene-specific logic
  if (currentScene === 'birth') {
    // Fade in particles (update aLife buffer)
    fadeInParticles(delta);
  }

  if (currentScene === 'chaos') {
    // CPU-side mouse physics
    applyMousePhysics(mousePos, delta);
    geometry.attributes.position.needsUpdate = true;
  }

  if (currentScene === 'love') {
    // Heart beat pulse
    const beat = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5;
    material.uniforms.uBeat.value = beat;
  }
});
```

---

## 6. GLSL Shaders

### `noise.glsl` — Simplex 3D + Curl Noise

```glsl
// 3D Simplex Noise (Ashima Arts)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  // ... full simplex3 implementation
}

// Curl noise from simplex
vec3 curlNoise(vec3 p) {
  float eps = 0.001;
  vec3 curl;

  float n1 = snoise(vec3(p.x, p.y + eps, p.z));
  float n2 = snoise(vec3(p.x, p.y - eps, p.z));
  float n3 = snoise(vec3(p.x, p.y, p.z + eps));
  float n4 = snoise(vec3(p.x, p.y, p.z - eps));
  float n5 = snoise(vec3(p.x + eps, p.y, p.z));
  float n6 = snoise(vec3(p.x - eps, p.y, p.z));

  curl.x = (n1 - n2 - n3 + n4) / (2.0 * eps);
  curl.y = (n3 - n4 - n5 + n6) / (2.0 * eps);
  curl.z = (n5 - n6 - n1 + n2) / (2.0 * eps);

  return curl;
}
```

### `particleVertex.glsl`

```glsl
attribute vec3 aTarget;
attribute vec3 aColor;
attribute float aSize;
attribute float aDelay;
attribute float aLife;
attribute vec3 aRandom;

uniform float uTime;
uniform float uMorphProgress;
uniform float uWarpStretch;
uniform float uPointScale;
uniform float uBeat;
uniform float uColorPhase;
uniform vec2 uMouse;
uniform float uMouseRadius;

varying vec3 vColor;
varying float vAlpha;

// #include noise.glsl (will be prepended)

void main() {
  // 1. Staggered morph with smooth easing
  float t = clamp((uMorphProgress - aDelay * 0.3) / 0.7, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t); // smoothstep

  // 2. Organic flow via curl noise (only when not fully morphed)
  vec3 flow = curlNoise(position * 0.015 + uTime * 0.08 + aRandom) * (1.0 - t) * 3.0;

  // 3. Idle drift even when morphed (subtle life)
  vec3 idle = curlNoise(aTarget * 0.05 + uTime * 0.15) * t * 0.3;

  // 4. Interpolate with flow
  vec3 pos = mix(position + flow, aTarget + idle, t);

  // 5. Warp speed stretch
  pos.z += pos.z * uWarpStretch * 5.0;

  // 6. Heart beat pulse (Scene 5)
  pos *= 1.0 + uBeat * 0.05;

  // 7. Color grading per phase (NO pure black — deep navy base)
  //    Stars: #ffffff (1,1,1)  →  Love: #ff758c (1,0.46,0.55)  →  Glow: #ff7eb3 (1,0.49,0.70)
  vec3 starColor   = vec3(1.00, 1.00, 1.00);   // #ffffff — white stars
  vec3 birthColor  = vec3(0.06, 0.05, 0.16);   // #0f0c29 — deep void (not black!)
  vec3 memoryColor = aColor;                    // from image sample
  vec3 loveColor   = vec3(1.00, 0.46, 0.55);   // #ff758c — love pink
  vec3 glowColor   = vec3(1.00, 0.49, 0.70);   // #ff7eb3 — glow pink
  vec3 warpColor   = vec3(0.80, 0.60, 1.00);   // purple-gold warp streaks

  float phase = uColorPhase;
  vec3 finalColor = starColor;
  if (phase < 1.0) finalColor = mix(starColor, starColor * 0.8 + birthColor * 0.2, phase);
  else if (phase < 2.0) finalColor = mix(starColor, memoryColor, phase - 1.0);
  else if (phase < 3.0) finalColor = mix(memoryColor, loveColor, phase - 2.0);
  else if (phase < 4.0) finalColor = mix(loveColor, warpColor, phase - 3.0);
  else finalColor = mix(warpColor, glowColor, clamp(phase - 4.0, 0.0, 1.0));

  vColor = finalColor;
  vAlpha = aLife;

  // 8. Project
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float sizeScale = uPointScale * (300.0 / -mvPosition.z);
  gl_PointSize = aSize * sizeScale * (1.0 + uBeat * 0.15);
  gl_Position = projectionMatrix * mvPosition;
}
```

### `particleFragment.glsl`

```glsl
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Distance from center of point sprite
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Core (bright center) + soft glow (outer)
  float core = smoothstep(0.5, 0.05, d);
  float glow = smoothstep(0.5, 0.0, d) * 0.3;
  float alpha = (core + glow) * vAlpha;

  // Slight color boost at core
  vec3 color = vColor + core * 0.2;

  gl_FragColor = vec4(color, alpha);
}
```

---

## 7. Post-Processing — `PostFX.jsx`

```jsx
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import useUniverse from '../store/useUniverse';

export default function PostFX() {
  const warpStretch = useUniverse(s => s.warpStretch);
  const currentScene = useUniverse(s => s.currentScene);

  // Dynamic bloom based on scene
  const bloomIntensity = {
    void: 0.2, birth: 0.3, memory: 0.5,
    chaos: 0.8, gravity: 1.5, love: 0.8
  }[currentScene] || 0.5;

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        offset={[warpStretch * 0.005, warpStretch * 0.005]}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.04}
        blendFunction={BlendFunction.OVERLAY}
      />
      <Vignette
        offset={0.3}
        darkness={0.9}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
```

---

## 8. Camera Cinematics — `CameraRig.jsx`

```jsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import useUniverse from '../store/useUniverse';

export default function CameraRig() {
  const groupRef = useRef();

  useFrame((state) => {
    const { scrollProgress, currentScene } = useUniverse.getState();
    const t = state.clock.elapsedTime;

    // Dolly zoom based on scroll
    const zMap = { void: 100, birth: 80, memory: 50, chaos: 40, gravity: 10, love: 30 };
    const targetZ = zMap[currentScene] || 50;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.02;

    // Subtle shake during chaos
    if (currentScene === 'chaos') {
      groupRef.current.position.x = Math.sin(t * 15) * 0.15;
      groupRef.current.position.y = Math.cos(t * 12) * 0.1;
    } else {
      groupRef.current.position.x *= 0.95;
      groupRef.current.position.y *= 0.95;
    }

    // Slow orbit during love
    if (currentScene === 'love') {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.3;
    }
  });

  return <group ref={groupRef} />;
  // Camera is parented to this group in Canvas3D
}
```

---

## 9. Image Sampler — `imageSampler.js`

```js
/**
 * Load an image and sample its bright pixels into 3D particle positions.
 * @param {string} url - Image URL
 * @param {number} sampleSize - Canvas resolution (e.g., 200)
 * @param {number} maxParticles - Max positions to return
 * @returns {Promise<{ positions: Float32Array, colors: Float32Array }>}
 */
export async function sampleImage(url, sampleSize = 200, maxParticles = 80000) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d');

      // Draw image centered & covering canvas
      const scale = Math.max(sampleSize / img.width, sampleSize / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (sampleSize - w) / 2, (sampleSize - h) / 2, w, h);

      const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      const tempPositions = [];
      const tempColors = [];

      // Collect bright pixels
      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          const i = (y * sampleSize + x) * 4;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const brightness = r * 0.299 + g * 0.587 + b * 0.114;

          if (brightness > 0.1) {
            // Map to world coords (centered, Y-flipped)
            const wx = (x / sampleSize - 0.5) * 30;
            const wy = -(y / sampleSize - 0.5) * 30;
            const wz = (brightness - 0.5) * 5; // Depth from brightness

            tempPositions.push(wx, wy, wz);
            tempColors.push(r, g, b);
          }
        }
      }

      // Subsample or pad to maxParticles
      const positions = new Float32Array(maxParticles * 3);
      const colors = new Float32Array(maxParticles * 3);
      const available = tempPositions.length / 3;

      for (let i = 0; i < maxParticles; i++) {
        const src = i % available;
        positions[i * 3]     = tempPositions[src * 3]     + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = tempPositions[src * 3 + 1] + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = tempPositions[src * 3 + 2] + (Math.random() - 0.5) * 0.5;
        colors[i * 3]     = tempColors[src * 3];
        colors[i * 3 + 1] = tempColors[src * 3 + 1];
        colors[i * 3 + 2] = tempColors[src * 3 + 2];
      }

      resolve({ positions, colors });
    };
    img.src = url;
  });
}
```

---

## 10. Heart Generator — `heartGenerator.js`

```js
/**
 * Generate 3D heart surface positions using parametric equation.
 * @param {number} count - Number of points
 * @returns {{ positions: Float32Array, colors: Float32Array }}
 */
export function generateHeart(count = 80000) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scale = 0.18;

  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;

    // Parametric heart
    const x = 16 * Math.pow(Math.sin(u), 3);
    const y = 13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u);
    const z = Math.sin(v) * Math.sqrt(Math.abs(x)) * 0.8;

    positions[i * 3]     = x * scale + (Math.random() - 0.5) * 0.3;
    positions[i * 3 + 1] = y * scale + 2 + (Math.random() - 0.5) * 0.3;
    positions[i * 3 + 2] = z * scale + (Math.random() - 0.5) * 0.3;

    // #ff758c → #ff7eb3 gradient based on height
    const t = (y * scale + 4) / 8;
    colors[i * 3]     = 1.0;                    // R: always 1.0
    colors[i * 3 + 1] = 0.46 + t * 0.03;       // G: 0.46 (#ff758c) → 0.49 (#ff7eb3)
    colors[i * 3 + 2] = 0.55 + t * 0.15;       // B: 0.55 (#ff758c) → 0.70 (#ff7eb3)
  }

  return { positions, colors };
}
```

---

## 11. Text Generator — `textGenerator.js`

```js
/**
 * Render text on hidden canvas and sample pixel positions.
 * @param {string} text
 * @param {number} maxParticles
 * @returns {{ positions: Float32Array }}
 */
export function textToParticles(text, maxParticles = 80000) {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size / 4;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const temp = [];

  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] > 128) {
        const wx = (x / canvas.width - 0.5) * 40;
        const wy = -(y / canvas.height - 0.5) * 10;
        temp.push(wx, wy, (Math.random() - 0.5) * 2);
      }
    }
  }

  const positions = new Float32Array(maxParticles * 3);
  const available = temp.length / 3;
  for (let i = 0; i < maxParticles; i++) {
    const src = i % Math.max(available, 1);
    positions[i * 3]     = temp[src * 3]     || (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = temp[src * 3 + 1] || (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = temp[src * 3 + 2] || (Math.random() - 0.5) * 60;
  }

  return { positions };
}
```

---

## 12. Audio Manager — `audioManager.js`

All sounds synthesized — no external audio files needed.

```js
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.layers = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  // Low ambient drone (Scene 1-2)
  startDrone() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55; // Low A
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.layers.drone = { osc, gain };
  }

  // Sparkle sounds (Scene 2)
  playSparkle() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 2000 + Math.random() * 3000;
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.random() * 2 - 1;
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // Wind whoosh (Scene 3)
  playWhoosh() {
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.5);
    const gain = this.ctx.createGain();
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // Bass impact (Scene 4)
  playImpact() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40;
    gain.gain.value = 0.4;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  // Heartbeat (Scene 5) — two thuds
  startHeartbeat() {
    const beat = () => {
      const thud = (delay) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.value = 50;
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.15);
      };
      thud(0);
      thud(0.15);
    };
    this.layers.heartbeatInterval = setInterval(beat, 850);
  }

  stopHeartbeat() {
    if (this.layers.heartbeatInterval) {
      clearInterval(this.layers.heartbeatInterval);
    }
  }

  setMasterVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  dispose() {
    this.stopHeartbeat();
    if (this.ctx) this.ctx.close();
  }
}
```

---

## 13. Mouse Physics — `useMousePhysics.js`

```js
import { useCallback, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useUniverse from '../store/useUniverse';

export default function useMousePhysics(geometryRef, velocitiesRef) {
  const mouse3D = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const { camera } = useThree();

  const onPointerMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.current.setFromCamera({ x, y }, camera);
    const dir = raycaster.current.ray.direction;
    mouse3D.current.copy(camera.position).add(dir.multiplyScalar(40));
    useUniverse.getState().setMousePos({ x, y });
  }, [camera]);

  useFrame((_, delta) => {
    if (!useUniverse.getState().mouseInteraction) return;
    if (!geometryRef.current) return;

    const positions = geometryRef.current.attributes.position.array;
    const targets = geometryRef.current.attributes.aTarget.array;
    const velocities = velocitiesRef.current;
    const mouse = mouse3D.current;
    const count = positions.length / 3;

    const repulsionRadius = 8;
    const repulsionStrength = 200;
    const springK = 2.0;
    const damping = 0.92;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;

      // Distance to mouse
      const dx = positions[ix]     - mouse.x;
      const dy = positions[ix + 1] - mouse.y;
      const dz = positions[ix + 2] - mouse.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Repulsion force
      if (dist < repulsionRadius && dist > 0.01) {
        const force = repulsionStrength / (dist * dist);
        velocities[ix]     += (dx / dist) * force * delta;
        velocities[ix + 1] += (dy / dist) * force * delta;
        velocities[ix + 2] += (dz / dist) * force * delta;
      }

      // Spring back to target
      velocities[ix]     += (targets[ix]     - positions[ix])     * springK * delta;
      velocities[ix + 1] += (targets[ix + 1] - positions[ix + 1]) * springK * delta;
      velocities[ix + 2] += (targets[ix + 2] - positions[ix + 2]) * springK * delta;

      // Damping
      velocities[ix]     *= damping;
      velocities[ix + 1] *= damping;
      velocities[ix + 2] *= damping;

      // Apply velocity
      positions[ix]     += velocities[ix]     * delta;
      positions[ix + 1] += velocities[ix + 1] * delta;
      positions[ix + 2] += velocities[ix + 2] * delta;
    }

    geometryRef.current.attributes.position.needsUpdate = true;
  });

  return { onPointerMove };
}
```

---

## 14. Adaptive Quality — `useAdaptiveQuality.js`

```js
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useUniverse from '../store/useUniverse';

export default function useAdaptiveQuality() {
  const { gl } = useThree();
  const frames = useRef([]);
  const lastCheck = useRef(0);
  const currentDPR = useRef(window.devicePixelRatio);

  useFrame((_, delta) => {
    const fps = 1 / Math.max(delta, 0.001);
    frames.current.push(fps);
    useUniverse.getState().setFps(Math.round(fps));

    const now = performance.now();
    if (now - lastCheck.current > 2000 && frames.current.length > 60) {
      const avg = frames.current.reduce((a, b) => a + b) / frames.current.length;

      if (avg < 35 && currentDPR.current > 1) {
        currentDPR.current = Math.max(1, currentDPR.current - 0.5);
        gl.setPixelRatio(currentDPR.current);
        useUniverse.getState().setQuality(currentDPR.current <= 1 ? 'low' : 'medium');
      } else if (avg > 55 && currentDPR.current < window.devicePixelRatio) {
        currentDPR.current = Math.min(window.devicePixelRatio, currentDPR.current + 0.25);
        gl.setPixelRatio(currentDPR.current);
        useUniverse.getState().setQuality('high');
      }

      frames.current = [];
      lastCheck.current = now;
    }
  });
}
```

---

## 15. Color Palette & Art Direction

> [!IMPORTANT]
> **NO pure black (#000000) anywhere.** Use deep navy/void tones with subtle color.

### Background: Radial Gradient
```css
body {
  background: radial-gradient(ellipse at center, #0f0c29 0%, #302b63 100%);
}
```

### CSS Custom Properties
```css
:root {
  /* ─── Background Layer ─── */
  --bg-center:  #0f0c29;    /* Deep void center (NOT black) */
  --bg-edge:    #302b63;    /* Purple edge gradient */

  /* ─── Particle Color Flow ─── */
  --star:       #ffffff;    /* Starting star particles */
  --love:       #ff758c;    /* Love pink (morph target) */
  --glow:       #ff7eb3;    /* Glow pink (final bloom) */

  /* ─── Accent Colors ─── */
  --purple:     #2d1b69;    /* Royal purple */
  --magenta:    #6b1d5e;    /* Deep magenta */
  --rose:       #ffd4e5;    /* Soft rose highlight */
  --warm-white: #f0e6ff;    /* Slightly purple white */
}
```

### Particle Color Flow Through Narrative
```
STAR (#ffffff)  ──→  remains white, twinkling in void
  │
  ▼ Birth
STAR (#ffffff)  ──→  particles brighten, subtle warm tint
  │
  ▼ Memory (morph to image)
IMAGE COLORS    ──→  sampled from image pixels
  │
  ▼ Chaos
LOVE (#ff758c)  ──→  warm pink shift during scatter
  │
  ▼ Warp
PURPLE-GOLD     ──→  warp streaks with chromatic aberration
  │
  ▼ Infinite Love
GLOW (#ff7eb3)  ──→  soft pink glow on beating heart
```

### Background: Never Pure Black
```
Canvas clear color:  #0f0c29  (matches gradient center)
Scene fog (subtle):  #0f0c29  (depth fade into void)
Overlay background:  rgba(15, 12, 41, 0.8)  (glassmorphism base)
```

---

## 16. Build Steps

// turbo-all

### Step 1: Initialize Vite + React Project
```bash
cd d:\Valentine
npx -y create-vite@latest ./ --template react
npm install
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing gsap zustand
```

### Step 2: Generate Heart Image
Use `generate_image` tool for particle morph target.

### Step 3: Create All Source Files
Follow the project structure in Section 2. Build order:
1. `src/index.css` (palette + global styles)
2. `src/store/useUniverse.js` (state first)
3. `src/shaders/*.glsl` (shader code)
4. `src/utils/*` (image sampler, heart, text, audio)
5. `src/hooks/*` (scroll, mouse, quality, audio)
6. `src/components/*` (Canvas3D, Particles, Camera, PostFX, Overlay)
7. `src/App.jsx` (assemble everything)
8. `src/main.jsx` (entry point)

### Step 4: Run Development Server
```bash
npm run dev
```

### Step 5: Verify in Browser
- Check all 5 scenes via scroll
- Test mouse interactions in chaos scene
- Verify post-processing effects
- Test audio toggle
- Test debug overlay (` key)
- Check adaptive quality

---

## 17. Visual Direction & Shader Enhancements 🎨

> [!IMPORTANT]
> ส่วนนี้เพิ่ม organic feel ให้ morph — ทำให้ดูเหมือน "ก่อตัวจริง" ไม่ใช่ tutorial morph ธรรมดา

### A) Brightness Delay Morph (Staggered by Luminance)

**แนวคิด:** Pixel สว่างจากรูปจะ morph ก่อน → pixel มืดตามทีหลัง ทำให้ภาพ "ปรากฏ" แบบ organic เหมือนกำลังก่อตัวจริง ๆ

#### 1. เพิ่ม `aBrightness` Attribute — `imageSampler.js`

```js
export async function sampleImage(url, sampleSize = 200, maxParticles = 80000) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d');

      const scale = Math.max(sampleSize / img.width, sampleSize / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (sampleSize - w) / 2, (sampleSize - h) / 2, w, h);

      const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      const tempPositions = [];
      const tempColors = [];
      const tempBrightness = [];  // ★ NEW

      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          const i = (y * sampleSize + x) * 4;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const brightness = r * 0.299 + g * 0.587 + b * 0.114;

          if (brightness > 0.1) {
            const wx = (x / sampleSize - 0.5) * 30;
            const wy = -(y / sampleSize - 0.5) * 30;
            const wz = (brightness - 0.5) * 5;

            tempPositions.push(wx, wy, wz);
            tempColors.push(r, g, b);
            tempBrightness.push(brightness);  // ★ Store brightness per pixel
          }
        }
      }

      const positions = new Float32Array(maxParticles * 3);
      const colors = new Float32Array(maxParticles * 3);
      const brightness = new Float32Array(maxParticles);  // ★ NEW array
      const available = tempPositions.length / 3;

      for (let i = 0; i < maxParticles; i++) {
        const src = i % available;
        positions[i * 3]     = tempPositions[src * 3]     + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = tempPositions[src * 3 + 1] + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = tempPositions[src * 3 + 2] + (Math.random() - 0.5) * 0.5;
        colors[i * 3]     = tempColors[src * 3];
        colors[i * 3 + 1] = tempColors[src * 3 + 1];
        colors[i * 3 + 2] = tempColors[src * 3 + 2];
        brightness[i] = tempBrightness[src];  // ★ Copy brightness
      }

      resolve({ positions, colors, brightness });  // ★ Return brightness
    };
    img.src = url;
  });
}
```

#### 2. เพิ่ม Attribute ใน `ParticleUniverse.jsx`

```jsx
// ใน BufferGeometry setup, เพิ่ม:
geometry.setAttribute('aBrightness',
  new THREE.BufferAttribute(imageData.brightness, 1)
);
```

#### 3. Vertex Shader — Brightness-Staggered Morph

```glsl
// ★ NEW attribute
attribute float aBrightness;

void main() {
  // ★ Brightness Delay Morph — สว่างไปก่อน, มืดตามทีหลัง
  float delay = (1.0 - aBrightness) * 0.35;  // มืด = delay สูง
  float rawProgress = clamp((uMorphProgress - delay) / (1.0 - delay * 0.5), 0.0, 1.0);

  // Triple-smooth easing สำหรับ organic feel
  float t = rawProgress * rawProgress * (3.0 - 2.0 * rawProgress);
  t = t * t * (3.0 - 2.0 * t);  // Double smoothstep = ultra smooth

  // Organic flow via curl noise (เมื่อยังไม่ morph เสร็จ)
  vec3 flow = curlNoise(position * 0.015 + uTime * 0.08 + aRandom) * (1.0 - t) * 3.0;

  // ★ Enhanced idle drift (subtle life — ภาพ "หายใจ")
  vec3 idle = curlNoise(aTarget * 0.05 + uTime * 0.15) * t * 0.3;
  idle += curlNoise(aTarget * 0.12 + uTime * 0.07) * t * 0.15;  // ★ Second octave

  vec3 pos = mix(position + flow, aTarget + idle, t);

  // ... rest of shader
}
```

### B) Idle Motion — Micro Movement (Breathing Effect)

**แนวคิด:** หลัง morph เสร็จ อย่าให้นิ่ง — เพิ่ม multi-layer curl noise ให้ภาพ "หายใจ" ตลอดเวลา

```glsl
// ★ Enhanced Idle Motion — ใน particleVertex.glsl
// Multi-octave curl noise สำหรับ "breathing" effect

// Layer 1: Large slow movement (ปอดใหญ่)
vec3 breathe1 = curlNoise(aTarget * 0.03 + uTime * 0.05) * 0.25;

// Layer 2: Medium detail (คลื่นเล็ก)
vec3 breathe2 = curlNoise(aTarget * 0.08 + uTime * 0.12 + 100.0) * 0.12;

// Layer 3: Fine shimmer (ระยิบ)
vec3 breathe3 = curlNoise(aTarget * 0.2 + uTime * 0.25 + 200.0) * 0.05;

// Combine — only active when morphed (t ≈ 1.0)
vec3 idle = (breathe1 + breathe2 + breathe3) * t;

// Beat-sync breathing amplitude
float breatheAmp = 1.0 + sin(uTime * 1.2) * 0.08;
idle *= breatheAmp;
```

> [!TIP]
> ผลลัพธ์: particles จะไม่นิ่งเลย — ดู "มีชีวิต" ตลอดเวลา ดูเป็นมืออาชีพทันที

---

## 18. Depth & Cinematic Layer 🎥

### A) Exponential Depth Fog

ใส่ fog ใน fragment shader ให้มีระยะใกล้ไกล — ดูเป็นอวกาศจริง ไม่ flat

#### Vertex Shader — ส่ง depth ไป fragment

```glsl
// ★ เพิ่ม varying
varying float vFogDepth;

void main() {
  // ... existing morph code ...

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // ★ Fog depth — ระยะจากกล้อง
  vFogDepth = -mvPosition.z;

  gl_PointSize = aSize * sizeScale * (1.0 + uBeat * 0.15);
  gl_Position = projectionMatrix * mvPosition;
}
```

#### Fragment Shader — Exponential Fog

```glsl
varying vec3 vColor;
varying float vAlpha;
varying float vFogDepth;  // ★ NEW

uniform float uFogDensity;   // ★ NEW — default 0.012
uniform vec3 uFogColor;      // ★ NEW — #0f0c29 = vec3(0.059, 0.047, 0.161)

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  float core = smoothstep(0.5, 0.05, d);
  float glow = smoothstep(0.5, 0.0, d) * 0.3;
  float alpha = (core + glow) * vAlpha;

  vec3 color = vColor + core * 0.2;

  // ★ Exponential squared fog — ไกลออกไปค่อย ๆ จาง
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  // Mix: ไกล → จาง → สี void (ไม่ใช่ดำ!)
  color = mix(color, uFogColor, fogFactor);
  alpha *= (1.0 - fogFactor * 0.6);  // ไกลออกไป alpha ลดด้วย

  gl_FragColor = vec4(color, alpha);
}
```

#### Uniforms Setup — `ParticleUniverse.jsx`

```js
// ShaderMaterial uniforms — เพิ่ม fog
uFogDensity: { value: 0.012 },
uFogColor: { value: new THREE.Color(0x0f0c29) },  // Deep void — NOT black
```

### B) Depth of Field (DOF) — Love Scene Zoom Focus

ตอน scroll เข้า phase "Love" → เปิด DOF → blur พื้นหลัง → โฟกัสที่หัวใจ/QR

#### `PostFX.jsx` — เพิ่ม DepthOfField

```jsx
import {
  EffectComposer, Bloom, Noise, Vignette,
  ChromaticAberration, DepthOfField  // ★ ADD
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import useUniverse from '../store/useUniverse';

export default function PostFX() {
  const warpStretch = useUniverse(s => s.warpStretch);
  const currentScene = useUniverse(s => s.currentScene);
  const scrollProgress = useUniverse(s => s.scrollProgress);

  const bloomIntensity = {
    void: 0.2, birth: 0.3, memory: 0.5,
    chaos: 0.8, gravity: 1.5, love: 0.8
  }[currentScene] || 0.5;

  // ★ DOF only during Love scene — cinematic focus
  const isLove = currentScene === 'love';
  const dofBokehScale = isLove ? 4.0 : 0;
  const dofFocusDistance = isLove ? 0.02 : 0;
  const dofFocalLength = isLove ? 0.05 : 0;

  // ★ Enhanced CA during warp — red/blue edge split
  const caOffset = currentScene === 'gravity'
    ? [warpStretch * 0.008, warpStretch * 0.006]  // ★ Asymmetric = more cinematic
    : [warpStretch * 0.003, warpStretch * 0.003];

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      {/* ★ DOF — cinematic focus on heart/QR */}
      {isLove && (
        <DepthOfField
          focusDistance={dofFocusDistance}
          focalLength={dofFocalLength}
          bokehScale={dofBokehScale}
        />
      )}

      <ChromaticAberration
        offset={caOffset}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.04}
        blendFunction={BlendFunction.OVERLAY}
      />
      <Vignette
        offset={0.3}
        darkness={0.9}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
```

### C) Chromatic Aberration — Cinematic Edge Split

> [!NOTE]
> CA มีอยู่แล้วใน Section 7 — แต่ที่เพิ่มคือ **asymmetric offset** ตอน warp (แดง/ฟ้าแยกคนละทิศ) + dynamic intensity ตาม scroll progress ทำให้ดู cinematic มากกว่า uniform CA

```js
// ★ Dynamic CA calculation — ใน PostFX.jsx
// ตอน warp: horizontal offset > vertical → anamorphic lens feel
const caX = warpStretch * 0.008 + Math.sin(scrollProgress * Math.PI) * 0.002;
const caY = warpStretch * 0.005;
// ผล: ดูเหมือนถ่ายด้วยเลนส์ anamorphic จริง
```

---

## 19. Physics & Interaction Upgrade 🌪

### A) Curl Noise Field Explosion (Nebula Flow)

**แนวคิด:** ตอน chaos scene เมื่อ particles กระจาย → อย่า random explode → ให้ไหลตาม curl noise field เหมือน nebula / แรงลมในจักรวาล

#### `useMousePhysics.js` — Curl Field Integration

```js
import { useCallback, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useUniverse from '../store/useUniverse';

// ★ Simple CPU curl noise (JS version of GLSL curl)
function simplexNoise3D(x, y, z) {
  // Simplified hash-based noise for CPU physics
  const dot = x * 12.9898 + y * 78.233 + z * 45.164;
  return Math.sin(dot) * 43758.5453 % 1;
}

function curlNoiseCPU(x, y, z) {
  const eps = 0.01;
  const n1 = simplexNoise3D(x, y + eps, z);
  const n2 = simplexNoise3D(x, y - eps, z);
  const n3 = simplexNoise3D(x, y, z + eps);
  const n4 = simplexNoise3D(x, y, z - eps);
  const n5 = simplexNoise3D(x + eps, y, z);
  const n6 = simplexNoise3D(x - eps, y, z);

  return {
    x: (n1 - n2 - n3 + n4) / (2.0 * eps),
    y: (n3 - n4 - n5 + n6) / (2.0 * eps),
    z: (n5 - n6 - n1 + n2) / (2.0 * eps),
  };
}

export default function useMousePhysics(geometryRef, velocitiesRef) {
  const mouse3D = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const { camera } = useThree();
  const timeRef = useRef(0);   // ★ Track time for noise animation

  const onPointerMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.current.setFromCamera({ x, y }, camera);
    const dir = raycaster.current.ray.direction;
    mouse3D.current.copy(camera.position).add(dir.multiplyScalar(40));
    useUniverse.getState().setMousePos({ x, y });
  }, [camera]);

  useFrame((_, delta) => {
    if (!useUniverse.getState().mouseInteraction) return;
    if (!geometryRef.current) return;

    timeRef.current += delta;

    const positions = geometryRef.current.attributes.position.array;
    const targets = geometryRef.current.attributes.aTarget.array;
    const velocities = velocitiesRef.current;
    const mouse = mouse3D.current;
    const count = positions.length / 3;

    const repulsionRadius = 8;
    const repulsionStrength = 200;
    const springK = 2.0;
    const damping = 0.92;
    const curlStrength = 15.0;  // ★ Curl field strength

    for (let i = 0; i < count; i++) {
      const ix = i * 3;

      const dx = positions[ix]     - mouse.x;
      const dy = positions[ix + 1] - mouse.y;
      const dz = positions[ix + 2] - mouse.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // ★ Repulsion + Curl Noise Field (swept like nebula)
      if (dist < repulsionRadius && dist > 0.01) {
        const force = repulsionStrength / (dist * dist);

        // Radial repulsion
        velocities[ix]     += (dx / dist) * force * delta * 0.4;
        velocities[ix + 1] += (dy / dist) * force * delta * 0.4;
        velocities[ix + 2] += (dz / dist) * force * delta * 0.4;

        // ★ Curl noise flow — nebula swirl instead of random scatter
        const curl = curlNoiseCPU(
          positions[ix] * 0.05 + timeRef.current * 0.3,
          positions[ix + 1] * 0.05,
          positions[ix + 2] * 0.05
        );
        const curlFade = 1.0 - (dist / repulsionRadius);  // Stronger near mouse
        velocities[ix]     += curl.x * curlStrength * curlFade * delta;
        velocities[ix + 1] += curl.y * curlStrength * curlFade * delta;
        velocities[ix + 2] += curl.z * curlStrength * curlFade * delta;
      }

      // Spring back to target
      velocities[ix]     += (targets[ix]     - positions[ix])     * springK * delta;
      velocities[ix + 1] += (targets[ix + 1] - positions[ix + 1]) * springK * delta;
      velocities[ix + 2] += (targets[ix + 2] - positions[ix + 2]) * springK * delta;

      // Damping
      velocities[ix]     *= damping;
      velocities[ix + 1] *= damping;
      velocities[ix + 2] *= damping;

      // Apply velocity
      positions[ix]     += velocities[ix]     * delta;
      positions[ix + 1] += velocities[ix + 1] * delta;
      positions[ix + 2] += velocities[ix + 2] * delta;
    }

    geometryRef.current.attributes.position.needsUpdate = true;
  });

  return { onPointerMove };
}
```

### B) Radial Shockwave — Climax Push Wave

**แนวคิด:** ตอน climax (transition gravity → love) → สร้าง radial wave ที่ push particles ตามระยะ เป็นคลื่น ๆ

#### Zustand State — `useUniverse.js` (เพิ่ม)

```js
// เพิ่มใน state
shockwave: null,  // { origin: vec3, time: 0, strength: 1.0 }

// เพิ่ม action
triggerShockwave: (origin, strength = 1.0) => set({
  shockwave: { origin, time: 0, strength }
}),
advanceShockwave: (delta) => {
  const sw = get().shockwave;
  if (!sw) return;
  const newTime = sw.time + delta;
  if (newTime > 2.0) {
    set({ shockwave: null });  // Auto-clear after 2 seconds
  } else {
    set({ shockwave: { ...sw, time: newTime } });
  }
},
```

#### Vertex Shader — Shockwave Displacement

```glsl
// ★ Shockwave uniforms
uniform vec3 uShockOrigin;      // Center of shockwave (vec3)
uniform float uShockTime;       // 0–2.0 (elapsed time)
uniform float uShockStrength;   // 0–1.0

void main() {
  // ... existing morph + idle code → produces vec3 pos ...

  // ★ Radial Shockwave — ring wave push
  if (uShockTime > 0.0 && uShockStrength > 0.0) {
    vec3 toParticle = pos - uShockOrigin;
    float dist = length(toParticle);

    // Wave ring: expanding radius with falloff
    float waveRadius = uShockTime * 30.0;  // Speed of wave expansion
    float waveWidth = 5.0;                  // Ring thickness
    float waveDist = abs(dist - waveRadius);

    // Gaussian ring profile
    float waveForce = exp(-waveDist * waveDist / (waveWidth * waveWidth));

    // Fade out over time
    float timeFade = 1.0 - smoothstep(0.0, 2.0, uShockTime);

    // Push outward from center
    vec3 pushDir = normalize(toParticle + vec3(0.001));
    pos += pushDir * waveForce * uShockStrength * timeFade * 8.0;

    // ★ Subtle perpendicular wobble (makes wave feel real)
    vec3 tangent = cross(pushDir, vec3(0.0, 1.0, 0.0));
    pos += tangent * waveForce * sin(dist * 3.0 + uShockTime * 10.0) * timeFade * 1.5;
  }

  // ... rest of shader (projection, etc.) ...
}
```

#### Per-Frame Uniform Update — `ParticleUniverse.jsx`

```js
useFrame((state, delta) => {
  const { shockwave } = useUniverse.getState();

  // ★ Shockwave update
  if (shockwave) {
    material.uniforms.uShockOrigin.value.set(
      shockwave.origin.x, shockwave.origin.y, shockwave.origin.z
    );
    material.uniforms.uShockTime.value = shockwave.time;
    material.uniforms.uShockStrength.value = shockwave.strength;
    useUniverse.getState().advanceShockwave(delta);
  } else {
    material.uniforms.uShockTime.value = 0;
    material.uniforms.uShockStrength.value = 0;
  }
});
```

> [!TIP]
> Trigger shockwave ตอน transition จาก gravity → love:
> ```js
> // ใน useScrollTimeline.js เมื่อ scrollProgress ข้าม 0.75
> useUniverse.getState().triggerShockwave(new THREE.Vector3(0, 0, 0), 1.0);
> ```

---

## 20. Performance Upgrade ⚡

> [!IMPORTANT]
> Production-grade performance — ทำให้ลื่นบนทุกเครื่อง ทั้ง desktop, laptop, และ mobile

### A) Adaptive DPR (Enhanced)

`useAdaptiveQuality.js` ที่มีอยู่แล้วใน Section 14 → refine ด้วย hysteresis + smooth transitions

```js
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useUniverse from '../store/useUniverse';

export default function useAdaptiveQuality() {
  const { gl } = useThree();
  const frames = useRef([]);
  const lastCheck = useRef(0);
  const currentDPR = useRef(Math.min(window.devicePixelRatio, 2)); // ★ Cap at 2
  const targetDPR = useRef(currentDPR.current);
  const consecutiveLow = useRef(0);   // ★ Hysteresis counter
  const consecutiveHigh = useRef(0);

  useFrame((_, delta) => {
    const fps = 1 / Math.max(delta, 0.001);
    frames.current.push(fps);
    useUniverse.getState().setFps(Math.round(fps));

    const now = performance.now();
    if (now - lastCheck.current > 2000 && frames.current.length > 60) {
      const avg = frames.current.reduce((a, b) => a + b) / frames.current.length;
      const p1 = frames.current.sort((a, b) => a - b);
      const percentile1 = p1[Math.floor(p1.length * 0.01)]; // ★ 1st percentile (worst frames)

      // ★ Hysteresis: ต้อง low ติดต่อกัน 2 ครั้ง ก่อนลด
      if (avg < 35 || percentile1 < 20) {
        consecutiveLow.current++;
        consecutiveHigh.current = 0;
        if (consecutiveLow.current >= 2 && currentDPR.current > 0.75) {
          targetDPR.current = Math.max(0.75, currentDPR.current - 0.5);
        }
      } else if (avg > 55 && percentile1 > 45) {
        consecutiveHigh.current++;
        consecutiveLow.current = 0;
        if (consecutiveHigh.current >= 3) {  // ★ ต้อง high 3 ครั้ง ก่อนเพิ่ม
          targetDPR.current = Math.min(
            Math.min(window.devicePixelRatio, 2),
            currentDPR.current + 0.25
          );
        }
      } else {
        consecutiveLow.current = 0;
        consecutiveHigh.current = 0;
      }

      // ★ Smooth transition — ไม่กระตุก
      if (Math.abs(currentDPR.current - targetDPR.current) > 0.01) {
        currentDPR.current += (targetDPR.current - currentDPR.current) * 0.3;
        gl.setPixelRatio(currentDPR.current);

        const quality = currentDPR.current < 1 ? 'low' :
                        currentDPR.current < 1.5 ? 'medium' : 'high';
        useUniverse.getState().setQuality(quality);
      }

      frames.current = [];
      lastCheck.current = now;
    }
  });
}
```

### B) Particle Auto Scale — Device-Aware Count

```js
// ★ ใน ParticleUniverse.jsx — top level

function getOptimalParticleCount() {
  const gl = document.createElement('canvas').getContext('webgl2')
    || document.createElement('canvas').getContext('webgl');

  if (!gl) return 20000;  // ★ Absolute minimum fallback

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : '';

  // ★ Check GPU tier
  const isHighEnd = /RTX|RX 6|RX 7|M1|M2|M3|A1[4-9]|A[23]\d/i.test(renderer);
  const isLowEnd = /Intel|Mali|Adreno [1-5]/i.test(renderer);

  // ★ Check available memory (if API exists)
  const memory = (navigator as any).deviceMemory || 4; // GB

  // ★ Mobile detection
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    || ('ontouchstart' in window);

  if (isMobile) {
    return memory >= 6 ? 40000 : 25000;
  }

  if (isHighEnd)  return 150000;  // ★ 150k — เครื่องแรง
  if (isLowEnd)   return 30000;   // ★ 30k  — เครื่องอ่อน

  return 60000;                    // ★ 60k  — เครื่องกลาง (default)
}

const PARTICLE_COUNT = getOptimalParticleCount();
```

### C) WebGL2 Check + Graceful Fallback

```js
// ★ ใน Canvas3D.jsx

function getWebGLCapabilities() {
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  const gl1 = canvas.getContext('webgl');

  return {
    webgl2: !!gl2,
    webgl1: !!gl1,
    maxTextureSize: (gl2 || gl1)?.getParameter(
      (gl2 || gl1).MAX_TEXTURE_SIZE
    ) || 2048,
    maxVertexAttribs: (gl2 || gl1)?.getParameter(
      (gl2 || gl1).MAX_VERTEX_ATTRIBS
    ) || 8,
    floatTextures: !!(gl2 || gl1)?.getExtension('OES_texture_float'),
  };
}

export default function Canvas3D() {
  const caps = useRef(getWebGLCapabilities());

  // ★ Fallback config based on capabilities
  const postFXEnabled = caps.current.webgl2;  // No post-fx on WebGL1
  const useFloatTextures = caps.current.floatTextures;

  return (
    <Canvas
      gl={{
        antialias: caps.current.webgl2,
        alpha: false,
        powerPreference: 'high-performance',
        // ★ Force WebGL2 if available
        ...(caps.current.webgl2 ? {} : { webgl2: false }),
      }}
      dpr={Math.min(window.devicePixelRatio, 2)}
      camera={{ position: [0, 0, 100], fov: 60, near: 0.1, far: 500 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x0f0c29); // Deep void — not black
        // ★ Log capabilities for debug
        console.log('[Galaxy] WebGL2:', caps.current.webgl2,
          '| Particles:', PARTICLE_COUNT,
          '| DPR:', Math.min(window.devicePixelRatio, 2));
      }}
    >
      <ParticleUniverse />
      <CameraRig />
      {/* ★ Only enable PostFX if WebGL2 supported */}
      {postFXEnabled && <PostFX />}
      <Overlay />
    </Canvas>
  );
}
```

> [!TIP]
> Production thinking: ถ้า WebGL2 ไม่รองรับ → ปิด PostFX ทั้งหมด (Bloom, DOF, CA) แล้วเพิ่ม bloom effect ใน fragment shader แทน (ถูกกว่ามาก) — ผู้ใช้ยัง "เห็น" ความสวย แค่ลด quality

---

## 21. Emotional Layer — ทำให้ "รู้สึก" 💓

> [!IMPORTANT]
> ส่วนนี้คือสิ่งที่แยก "demo" ออกจาก "ผลงานระดับมืออาชีพ" — เพิ่ม layer ที่ทำให้ scene มีชีวิตและอารมณ์

### A) Audio Reactive System (Analyser Node)

**แนวคิด:** เสียง bass → particle pulse, เสียง high freq → sparkle shimmer

#### `audioManager.js` — เพิ่ม AnalyserNode

```js
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;       // ★ NEW
    this.frequencyData = null;  // ★ NEW
    this.layers = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;

    // ★ Analyser Node — real-time frequency data
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    // Route: sources → masterGain → analyser → destination
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.initialized = true;
  }

  // ★ Get real-time audio data for reactive visuals
  getAudioData() {
    if (!this.analyser) return { bass: 0, mid: 0, high: 0, overall: 0 };

    this.analyser.getByteFrequencyData(this.frequencyData);

    const bins = this.frequencyData;
    const binCount = bins.length;  // 128 bins

    // ★ Split frequency ranges
    let bass = 0, mid = 0, high = 0;
    const bassEnd = Math.floor(binCount * 0.1);    // ~0-400Hz
    const midEnd = Math.floor(binCount * 0.5);     // ~400-2kHz
    // Rest = high freq

    for (let i = 0; i < bassEnd; i++) bass += bins[i];
    for (let i = bassEnd; i < midEnd; i++) mid += bins[i];
    for (let i = midEnd; i < binCount; i++) high += bins[i];

    bass /= bassEnd * 255;
    mid /= (midEnd - bassEnd) * 255;
    high /= (binCount - midEnd) * 255;

    const overall = (bass * 0.5 + mid * 0.3 + high * 0.2);

    return { bass, mid, high, overall };
  }

  // ... existing methods (startDrone, playSparkle, etc.) ...
}
```

#### Uniform Update — `ParticleUniverse.jsx`

```js
// เพิ่ม uniforms
uAudioBass: { value: 0 },    // ★ bass strength 0–1
uAudioHigh: { value: 0 },    // ★ high freq strength 0–1

// ใน useFrame
useFrame(() => {
  const audioData = audioManager.getAudioData();

  // ★ Smooth audio values (avoid jitter)
  const currentBass = material.uniforms.uAudioBass.value;
  const currentHigh = material.uniforms.uAudioHigh.value;

  material.uniforms.uAudioBass.value += (audioData.bass - currentBass) * 0.15;
  material.uniforms.uAudioHigh.value += (audioData.high - currentHigh) * 0.2;
});
```

#### Vertex Shader — Audio Reactive Motion

```glsl
uniform float uAudioBass;    // ★ 0–1
uniform float uAudioHigh;    // ★ 0–1

void main() {
  // ... existing code ...

  // ★ Bass → particle pulse outward from center
  float bassExpand = uAudioBass * 0.8;
  pos *= 1.0 + bassExpand * smoothstep(0.0, 30.0, length(pos));

  // ★ High freq → sparkle size jitter
  float sparkle = uAudioHigh * sin(uTime * 20.0 + aRandom.x * 100.0) * 0.5;
  gl_PointSize *= (1.0 + sparkle);

  // ★ High freq → subtle position shimmer
  pos += aRandom * uAudioHigh * 0.3 * sin(uTime * 15.0 + aRandom.y * 50.0);
}
```

### B) Heartbeat Sync — Scale Heart to Audio

**แนวคิด:** ตอนจบ (Love scene) → scale หัวใจตามจังหวะ heartbeat audio — subtle แต่ impact สูง

```js
// ★ ใน ParticleUniverse.jsx — Love scene logic

useFrame((state) => {
  if (useUniverse.getState().currentScene === 'love') {
    const audioData = audioManager.getAudioData();

    // ★ Heartbeat from bass — double thud pattern
    // AudioManager outputs two thuds per beat (thud-thud)
    // Bass envelope ≈ heartbeat
    const heartPulse = audioData.bass;

    // ★ Smooth, spring-like response
    const currentBeat = material.uniforms.uBeat.value;
    const targetBeat = heartPulse;
    material.uniforms.uBeat.value += (targetBeat - currentBeat) * 0.1;

    // ★ Additional: subtle color warmth during beat
    const warmth = heartPulse * 0.15;
    material.uniforms.uHeartWarmth.value = warmth;
  }
});
```

```glsl
// ★ ใน particleFragment.glsl — heartbeat color warmth
uniform float uHeartWarmth;  // 0–0.15

void main() {
  // ... existing code ...

  // ★ Warm color pulse on beat — subtle pink shift
  color.r += uHeartWarmth;
  color.g -= uHeartWarmth * 0.3;

  gl_FragColor = vec4(color, alpha);
}
```

### C) QR Morph Climax — Smooth 3-Phase Flow

**แนวคิด:** heart → pulse → dissolve → QR code — ต่อเนื่องแบบหนัง ไม่สะดุด

#### Multi-Target Morph State — `useUniverse.js`

```js
// เพิ่มใน state
morphPhase: 'image',  // 'image' | 'heart' | 'dissolve' | 'qr'
morphTargets: {
  image: null,    // Float32Array — จากภาพ
  heart: null,    // Float32Array — จาก heartGenerator
  qr: null,       // Float32Array — จาก QR render
},
setMorphTargets: (targets) => set({ morphTargets: targets }),
setMorphPhase: (phase) => set({ morphPhase: phase }),
```

#### Morph Sequence Controller — `useScrollTimeline.js`

```js
// ★ Love scene sub-phases (scroll 75%–100%)
// 75%–82%:  morph to heart (from current positions)
// 82%–88%:  heart pulse + glow (hold shape, beat)
// 88%–93%:  dissolve (particles scatter slightly)
// 93%–100%: re-form into QR code

const loveSubProgress = (scrollProgress - 0.75) / 0.25;  // 0–1 within love

if (loveSubProgress < 0.28) {
  // Phase 1: Form heart
  const subT = loveSubProgress / 0.28;
  setMorphPhase('heart');
  material.uniforms.uMorphProgress.value = subT;
  // Targets = heartGenerator positions

} else if (loveSubProgress < 0.52) {
  // Phase 2: Heart beats (hold shape)
  setMorphPhase('heart');
  material.uniforms.uMorphProgress.value = 1.0;
  // uBeat drives scale animation

} else if (loveSubProgress < 0.72) {
  // Phase 3: Dissolve
  setMorphPhase('dissolve');
  const dissolveT = (loveSubProgress - 0.52) / 0.2;
  // ★ Partial reverse morph — particles drift outward
  material.uniforms.uMorphProgress.value = 1.0 - dissolveT * 0.4;
  // Curl noise kicks in stronger

} else {
  // Phase 4: Reform into QR
  setMorphPhase('qr');
  const qrT = (loveSubProgress - 0.72) / 0.28;
  material.uniforms.uMorphProgress.value = qrT;
  // ★ Targets swap to QR positions
  // Uses same brightness-delay morph for organic reveal
}
```

#### Multi-Target Buffer Swap — `ParticleUniverse.jsx`

```js
// ★ ตอนเปลี่ยน phase → swap aTarget buffer
useEffect(() => {
  const targets = useUniverse.getState().morphTargets;
  const phase = useUniverse.getState().morphPhase;

  if (!geometryRef.current || !targets) return;

  let newTargets;
  switch (phase) {
    case 'heart':
      newTargets = targets.heart;
      break;
    case 'qr':
      newTargets = targets.qr;
      break;
    default:
      newTargets = targets.image;
  }

  if (newTargets) {
    geometryRef.current.attributes.aTarget.array.set(newTargets);
    geometryRef.current.attributes.aTarget.needsUpdate = true;
  }
}, [morphPhase]);
```

> [!TIP]
> **Flow ทั้งหมด:**
> ```
> Scroll 20%–45%:  Stars ──→ Your Photo (brightness delay morph)
> Scroll 45%–55%:  Photo ──→ Chaos (curl noise scatter)
> Scroll 55%–75%:  Chaos ──→ Warp Speed (z-stretch + CA)
> Scroll 75%–82%:  Warp  ──→ Heart Form (organic morph)
> Scroll 82%–88%:  Heart ──→ Pulse Beat (audio sync)
> Scroll 88%–93%:  Heart ──→ Dissolve (gentle scatter)
> Scroll 93%–100%: Dust  ──→ QR Code (brightness delay morph)
> ```
> ดูเป็นหนังสั้น ไม่ใช่ demo

---

## 22. Enhancement Integration Checklist

### Files Modified by Enhancements

| File | Section 17 | Section 18 | Section 19 | Section 20 | Section 21 |
|---|---|---|---|---|---|
| `particleVertex.glsl` | ✅ aBrightness, idle | ✅ vFogDepth | ✅ shockwave | — | ✅ audio reactive |
| `particleFragment.glsl` | — | ✅ fog | — | — | ✅ heartWarmth |
| `imageSampler.js` | ✅ brightness export | — | — | — | — |
| `ParticleUniverse.jsx` | ✅ aBrightness attr | ✅ fog uniforms | ✅ shockwave uniforms | ✅ PARTICLE_COUNT | ✅ audio uniforms, multi-target |
| `PostFX.jsx` | — | ✅ DOF, CA enhance | — | — | — |
| `useMousePhysics.js` | — | — | ✅ curl noise field | — | — |
| `useUniverse.js` | — | — | ✅ shockwave state | — | ✅ morphPhase, targets |
| `useAdaptiveQuality.js` | — | — | — | ✅ hysteresis, smooth | — |
| `Canvas3D.jsx` | — | — | — | ✅ WebGL2 check | — |
| `audioManager.js` | — | — | — | — | ✅ AnalyserNode |
| `useScrollTimeline.js` | — | — | ✅ trigger shock | — | ✅ love sub-phases |

### New Attributes & Uniforms Summary

```
★ New Attributes:
  aBrightness  (float)      — Pixel brightness for staggered morph

★ New Uniforms:
  uFogDensity  (float)      — Fog density (0.012)
  uFogColor    (vec3)       — Fog color (#0f0c29)
  uShockOrigin (vec3)       — Shockwave center
  uShockTime   (float)      — Shockwave elapsed time
  uShockStrength (float)    — Shockwave strength
  uAudioBass   (float)      — Bass frequency strength (0–1)
  uAudioHigh   (float)      — High frequency strength (0–1)
  uHeartWarmth (float)      — Heartbeat color warmth (0–0.15)

★ New Varyings:
  vFogDepth    (float)      — Distance from camera for fog
```

---

## 23. Build Phases Roadmap 🗺️

> [!IMPORTANT]
> ลำดับ phase สำคัญ — แต่ละ phase ต่อยอดจาก phase ก่อนหน้า ห้ามข้าม

### Phase 1: Foundation & Core ✅
> โปรเจกต์ run ได้ + particles ลอยบนหน้าจอ

- [x] Init Vite + React + install dependencies
- [x] `index.css` — palette, fonts, radial gradient bg
- [x] `useUniverse.js` — Zustand state machine
- [x] `noise.glsl` — Simplex 3D + curl noise
- [x] `particleVertex.glsl` + `particleFragment.glsl` — with ALL enhancements
- [x] `ParticleUniverse.jsx` — auto-scaled particles + ShaderMaterial
- [x] `Canvas3D.jsx` — Canvas + WebGL2 fallback
- [x] `App.jsx` + `main.jsx`
- **Checkpoint:** `npm run dev` → particles floating on purple void

---

### Phase 2: Narrative Engine (Scroll → Scene)
> scroll ควบคุม scene ทั้งหมด + camera move

- [x] `useScrollTimeline.js` — GSAP ScrollTrigger ↔ Zustand
- [x] `CameraRig.jsx` — dolly zoom + chaos shake + love orbit
- [x] `Overlay.jsx` — scene titles + progress bar + debug
- [x] HTML scroll container (`#scroll-container` 500vh)
- **Checkpoint:** scroll 0→100% = camera moves 6 scenes + titles appear

---

### Phase 3: Morph System (Stars → Image → Heart)
> particles morph เป็นรูป แล้ว morph เป็นหัวใจ

- [x] `imageSampler.js` — image → positions + brightness (Sec.17)
- [x] `heartGenerator.js` — parametric heart
- [x] `textGenerator.js` — text → positions
- [ ] Generate `heart.png` via `generate_image`
- [ ] Wire morph targets → `aTarget` + `aBrightness`
- [ ] Verify brightness delay morph in browser
- **Checkpoint:** scroll 20→45% = stars morph to photo (bright first), then breathe

---

### Phase 4: Interaction & Physics (Chaos Scene)
> mouse ดัน particles + nebula swirl

- [x] `useMousePhysics.js` — repulsion + curl noise field (Sec.19A)
- [ ] Wire `mouseInteraction` flag per scene
- [ ] Verify shockwave at gravity → love transition (Sec.19B)
- **Checkpoint:** chaos = mouse scatters with nebula flow + shockwave at climax

---

### Phase 5: Cinematic & Post-FX
> ดู cinematic เหมือนถ่ายกล้องจริง

- [x] `PostFX.jsx` — Bloom + Noise + Vignette + CA + DOF
- [x] Depth fog in fragment shader (Sec.18A)
- [x] DOF during Love scene (Sec.18B)
- [x] Asymmetric CA during warp (Sec.18C)
- [ ] Fine-tune fog density + bloom per scene
- **Checkpoint:** fog depth + DOF focus heart + CA cinematic warp

---

### Phase 6: Audio & Emotional Layer
> scene "มีชีวิต" — เสียง + หัวใจเต้น

- [x] `audioManager.js` — synthesized sounds + AnalyserNode (Sec.21A)
- [x] `useAudio.js` — audio lifecycle
- [ ] Wire audio reactive → uAudioBass/uAudioHigh uniforms
- [ ] Heartbeat sync → uBeat from bass envelope (Sec.21B)
- [ ] Audio toggle working in browser
- **Checkpoint:** audio on = particles pulse to bass + heart beats

---

### Phase 7: QR Climax & Performance
> จบแบบหนัง + ลื่นทุกเครื่อง

- [ ] QR Morph Climax — 4-phase: heart → pulse → dissolve → QR (Sec.21C)
- [ ] Multi-target buffer swap
- [x] `useAdaptiveQuality.js` — hysteresis DPR (Sec.20A)
- [x] Particle Auto Scale — GPU-tier (Sec.20B)
- [x] WebGL2 Fallback (Sec.20C)
- **Checkpoint:** full scroll = cinematic → QR end + smooth all devices

---

### Phase 8: Polish & Ship 🚀
> production-ready

- [ ] Color grading fine-tune (all scenes)
- [ ] Easing curves review
- [ ] Mobile responsive
- [ ] Performance profiling
- [ ] `npm run build`
- **Checkpoint:** deployed + impressive on first visit
