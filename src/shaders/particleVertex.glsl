#include ./noise.glsl

// ─── Attributes ───
attribute vec3 aTargetA;   // photo morph target
attribute vec3 aTargetB;   // heart morph target
attribute vec3 aTargetC;   // proposal silhouette morph target
attribute vec3 aColor;
attribute float aSize;
attribute float aDelay;
attribute float aLife;
attribute vec3 aRandom;
attribute float aBrightness;

// ─── Uniforms ───
uniform float uTime;
uniform float uMorphPhase;     // 0→1 = stars→photo, 1→2 = photo→heart
uniform float uProposalPhase;  // 0→1 = stars→proposal silhouette (void scene)
uniform float uWarpStretch;
uniform float uEnergy;      // scene energy from config (chaos = 1.0)
uniform float uPointScale;
uniform float uBeat;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uMouseActive;  // 1.0 during chaos, 0.0 otherwise
uniform vec2 uMouseVelocity; // ★ mouse movement velocity (NDC/frame)
uniform float uAudioBass;
uniform float uAudioHigh;

// Shockwave uniforms
uniform vec3 uShockOrigin;
uniform float uShockTime;
uniform float uShockStrength;

// ─── Varyings ───
varying vec3 vColor;
varying float vAlpha;
varying float vFogDepth;
varying float vHeat;  // ★ Energy heatmap — passed to fragment for glow boost

// ─── Smooth morph with brightness delay ───
float morphT(float progress) {
  float delay = (1.0 - aBrightness) * 0.35;
  float raw = clamp((progress - delay) / (1.0 - delay * 0.5), 0.0, 1.0);
  // Double smoothstep = ultra smooth organic
  float t = raw * raw * (3.0 - 2.0 * raw);
  t = t * t * (3.0 - 2.0 * t);
  return t;
}

void main() {
  // ─── 0. Proposal silhouette morph (void scene) ───
  float tProposal = morphT(clamp(uProposalPhase, 0.0, 1.0));

  // ─── 1. Two-phase morph ───
  float phaseA = clamp(uMorphPhase, 0.0, 1.0);       // stars → photo
  float phaseB = clamp(uMorphPhase - 1.0, 0.0, 1.0); // photo → heart

  float tA = morphT(phaseA);
  float tB = morphT(phaseB);

  // ─── 2. Organic flow via curl noise (× energy — chaos only) ───
  float morphTotal = max(max(tA, tB), tProposal);
  vec3 noiseInput1 = position * 0.015 + aRandom + vec3(uTime * 0.08);
  vec3 flow = curlNoise(noiseInput1) * (1.0 - max(tA, tProposal)) * 3.0;

  // ★ Curl swirl scales with energy — chaos = crazy swirl, love = calm
  vec3 energySwirl = curlNoise(position * 0.05 + vec3(uTime * 0.3)) * uEnergy * 2.0;
  flow += energySwirl * (1.0 - morphTotal);  // fades when morphed

  // Energy modulates flow intensity
  flow *= 0.5 + uEnergy * 0.5;

  // ─── 3. Multi-octave idle breathing (subtle for Valentine vibe) ───
  vec3 currentTarget = mix(aTargetA, aTargetB, tB);

  vec3 breathe1 = curlNoise(currentTarget * 0.03 + vec3(uTime * 0.05)) * 0.15;
  vec3 breathe2 = curlNoise(currentTarget * 0.08 + vec3(uTime * 0.12 + 100.0)) * 0.07;
  vec3 breathe3 = curlNoise(currentTarget * 0.2 + vec3(uTime * 0.25 + 200.0)) * 0.03;
  vec3 idle = (breathe1 + breathe2 + breathe3) * morphTotal;
  float breatheAmp = 1.0 + sin(uTime * 1.2) * 0.05;
  idle *= breatheAmp;

  // ─── 3.5. Proposal silhouette breathing (gentler) ───
  vec3 proposalIdle = curlNoise(aTargetC * 0.02 + vec3(uTime * 0.04)) * 0.1 * tProposal;

  // ─── 4. Compute positions: depth-blended transition ───
  vec3 starPos = position + flow;
  vec3 proposalPos = aTargetC + proposalIdle;
  vec3 photoPos = aTargetA + idle;
  vec3 heartPos = aTargetB + idle;

  // Phase Proposal: stars → proposal (void scene)
  vec3 pos = mix(starPos, proposalPos, tProposal);
  // Phase A: (proposal/stars) → photo
  pos = mix(pos, photoPos, tA);
  // Phase B: photo → heart (smooth depth blend)
  pos = mix(pos, heartPos, tB);

  // Store pre-physics position for motion blur
  vec3 prePhysicsPos = pos;

  // ─── 5. Warp speed stretch ───
  pos.z += pos.z * uWarpStretch * 5.0;

  // ─── 5.5 Mouse Repulsion + Curl Swirl (chaos scene) ───
  float heat = 0.0;  // ★ Energy heatmap value (0 = cool, 1 = hot)

  if (uMouseActive > 0.5) {
    // Project mouse to world space (NDC * camera distance)
    vec3 mouseWorld = vec3(uMouse * 40.0, 0.0);
    vec3 toParticle = pos - mouseWorld;
    float dist = length(toParticle);

    if (dist > 0.01) {
      // ★ Organic exponential falloff — no hard edge
      float falloff = exp(-dist * 2.5 / uMouseRadius);

      // ★ Mouse velocity amplification
      float velocityMag = length(uMouseVelocity);
      float velocityBoost = smoothstep(0.0, 0.05, velocityMag);
      float totalForce = falloff * (1.0 + velocityBoost * 1.5);

      // ★ Heat = interaction force (subtle — for color tint + mild size)
      heat = clamp(totalForce * 0.8, 0.0, 1.0);

      // Repulsion — smooth push away from cursor
      vec3 pushDir = normalize(toParticle);
      pos += pushDir * totalForce * 3.0;

      // ★ Curl noise nebula swirl
      vec3 curlInput = pos * 0.05 + vec3(uTime * 0.4);
      vec3 curlSwirl = curlNoise(curlInput) * 4.0 * totalForce;
      pos += curlSwirl;
    }
  }

  // Pass heat to fragment shader
  vHeat = heat;

  // ─── 6. Heart beat pulse (real audio beat detection) ───
  float beatPulse = exp(-uBeat * 5.0) * 0.08;
  pos *= 1.0 + beatPulse;

  // ─── 7. Audio reactive ───
  float bassExpand = uAudioBass * 0.8;
  pos *= 1.0 + bassExpand * smoothstep(0.0, 30.0, length(pos));
  pos += aRandom * uAudioHigh * 0.3 * sin(uTime * 15.0 + aRandom.y * 50.0);

  // ─── 8. Shockwave displacement (3D + wobble) ───
  if (uShockTime > 0.0 && uShockStrength > 0.0) {
    vec3 toParticle = pos - uShockOrigin;
    float dist = length(toParticle);
    float waveRadius = uShockTime * 30.0;

    // ★ Gaussian ring profile — smooth energy wave
    float ring = exp(-pow(dist - waveRadius, 2.0) * 20.0 / (waveRadius + 1.0));
    float timeFade = 1.0 - smoothstep(0.0, 2.0, uShockTime);

    // ★ Push in ALL 3 axes (not just XY)
    vec3 pushDir = normalize(toParticle + vec3(0.001));
    pos += pushDir * ring * uShockStrength * timeFade * 8.0;

    // ★ Z-axis wobble — makes it look like a real energy wave
    pos.z += sin(dist * 10.0 - uTime * 5.0) * ring * timeFade * 1.5;

    // Perpendicular wobble for organic feel
    vec3 tangent = cross(pushDir, vec3(0.0, 1.0, 0.0));
    pos += tangent * ring * sin(dist * 3.0 + uShockTime * 10.0) * timeFade * 1.5;
  }

  // ─── 9. Color morphing (3 states + chaos shift + heatmap) ───
  vec3 starColor  = vec3(0.85, 0.85, 1.0);     // slightly blue white
  vec3 photoColor = aColor;                      // actual photo colors
  vec3 heartColor = vec3(1.0, 0.46, 0.55);      // heart pink

  // Morph colors in sync with positions
  vec3 finalColor = mix(starColor, photoColor, tA);   // stars → photo
  finalColor = mix(finalColor, heartColor, tB);        // photo → heart

  // ★ Chaos color shift — high energy = purple-magenta tint
  vec3 chaosColor = vec3(1.0, 0.3, 0.6);  // magenta
  finalColor = mix(finalColor, chaosColor, uEnergy * 0.3 * (1.0 - morphTotal));

  // ★ Energy Heatmap — proximity to mouse = subtle ember tint
  vec3 hotColor  = vec3(1.0, 0.4, 0.1);  // ember orange
  finalColor = mix(finalColor, hotColor, heat * 0.5);

  vColor = finalColor;

  // ─── 10. Alpha: prevent additive blowout during morph ───
  float morphAlpha = mix(1.0, 0.35, morphTotal);  // fade to 35% when morphed
  vAlpha = aLife * morphAlpha;

  // ─── 11. Project ───
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vFogDepth = -mvPosition.z;

  float sizeScale = uPointScale * (300.0 / -mvPosition.z);
  float sparkle = uAudioHigh * sin(uTime * 20.0 + aRandom.x * 100.0) * 0.5;
  gl_PointSize = aSize * sizeScale * (1.0 + uBeat * 0.15) * (1.0 + sparkle);

  // ─── 12. Morph-aware size ───
  float morphSize = mix(1.0, 0.4, tA);   // stars → photo: shrink to 40%
  morphSize = mix(morphSize, 0.45, tB);   // photo → heart: 45%
  gl_PointSize *= morphSize;

  // Brightness-based size boost
  gl_PointSize *= 1.0 + aBrightness * 0.4;

  // ★ Interaction Size Pulse — only during unmorphed/chaos (fades with morph)
  float sizePulse = 1.0 + heat * 0.6 * (1.0 - morphTotal);
  gl_PointSize *= min(sizePulse, 1.6);

  // ─── 13. Motion blur stretch — only during unmorphed/chaos ───
  vec3 velocity = pos - prePhysicsPos;
  float speed = length(velocity);
  float blurFade = 1.0 - morphTotal;  // 0 when morphed, 1 when stars
  gl_PointSize *= min(1.0 + speed * 0.3 * blurFade, 1.5);
  pos += velocity * min(speed, 1.0) * blurFade;

  // Recompute MVP after motion blur offset
  mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
