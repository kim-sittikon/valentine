#include ./noise.glsl

attribute vec3 aTarget;
attribute vec3 aColor;
attribute float aSize;
attribute float aDelay;
attribute float aLife;
attribute vec3 aRandom;
attribute float aBrightness;

uniform float uTime;
uniform float uMorphProgress;
uniform float uWarpStretch;
uniform float uPointScale;
uniform float uBeat;
uniform float uColorPhase;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uAudioBass;
uniform float uAudioHigh;

// Shockwave uniforms (Section 19B)
uniform vec3 uShockOrigin;
uniform float uShockTime;
uniform float uShockStrength;

varying vec3 vColor;
varying float vAlpha;
varying float vFogDepth;

void main() {
  // 1. Brightness Delay Morph (Section 17A)
  float delay = (1.0 - aBrightness) * 0.35;
  float rawProgress = clamp((uMorphProgress - delay) / (1.0 - delay * 0.5), 0.0, 1.0);

  // Double smoothstep = ultra smooth organic
  float t = rawProgress * rawProgress * (3.0 - 2.0 * rawProgress);
  t = t * t * (3.0 - 2.0 * t);

  // 2. Organic flow via curl noise (when not fully morphed)
  vec3 noiseInput1 = position * 0.015 + aRandom + vec3(uTime * 0.08);
  vec3 flow = curlNoise(noiseInput1) * (1.0 - t) * 3.0;

  // 3. Multi-octave idle breathing (Section 17B)
  vec3 breathe1 = curlNoise(aTarget * 0.03 + vec3(uTime * 0.05)) * 0.25;
  vec3 breathe2 = curlNoise(aTarget * 0.08 + vec3(uTime * 0.12 + 100.0)) * 0.12;
  vec3 breathe3 = curlNoise(aTarget * 0.2 + vec3(uTime * 0.25 + 200.0)) * 0.05;
  vec3 idle = (breathe1 + breathe2 + breathe3) * t;
  float breatheAmp = 1.0 + sin(uTime * 1.2) * 0.08;
  idle *= breatheAmp;

  // 4. Interpolate with flow
  vec3 pos = mix(position + flow, aTarget + idle, t);

  // 5. Warp speed stretch
  pos.z += pos.z * uWarpStretch * 5.0;

  // 6. Heart beat pulse (Scene 5)
  pos *= 1.0 + uBeat * 0.05;

  // 7. Audio reactive (Section 21A)
  float bassExpand = uAudioBass * 0.8;
  pos *= 1.0 + bassExpand * smoothstep(0.0, 30.0, length(pos));
  pos += aRandom * uAudioHigh * 0.3 * sin(uTime * 15.0 + aRandom.y * 50.0);

  // 8. Shockwave displacement (Section 19B)
  if (uShockTime > 0.0 && uShockStrength > 0.0) {
    vec3 toParticle = pos - uShockOrigin;
    float dist = length(toParticle);
    float waveRadius = uShockTime * 30.0;
    float waveWidth = 5.0;
    float waveDist = abs(dist - waveRadius);
    float waveForce = exp(-waveDist * waveDist / (waveWidth * waveWidth));
    float timeFade = 1.0 - smoothstep(0.0, 2.0, uShockTime);
    vec3 pushDir = normalize(toParticle + vec3(0.001));
    pos += pushDir * waveForce * uShockStrength * timeFade * 8.0;
    vec3 tangent = cross(pushDir, vec3(0.0, 1.0, 0.0));
    pos += tangent * waveForce * sin(dist * 3.0 + uShockTime * 10.0) * timeFade * 1.5;
  }

  // 9. Color grading per phase
  vec3 starColor   = vec3(1.00, 1.00, 1.00);
  vec3 birthColor  = vec3(0.06, 0.05, 0.16);
  vec3 memoryColor = aColor;
  vec3 loveColor   = vec3(1.00, 0.46, 0.55);
  vec3 glowColor   = vec3(1.00, 0.49, 0.70);
  vec3 warpColor   = vec3(0.80, 0.60, 1.00);

  float phase = uColorPhase;
  vec3 finalColor = starColor;
  if (phase < 1.0) finalColor = mix(starColor, starColor * 0.8 + birthColor * 0.2, phase);
  else if (phase < 2.0) finalColor = mix(starColor, memoryColor, phase - 1.0);
  else if (phase < 3.0) finalColor = mix(memoryColor, loveColor, phase - 2.0);
  else if (phase < 4.0) finalColor = mix(loveColor, warpColor, phase - 3.0);
  else finalColor = mix(warpColor, glowColor, clamp(phase - 4.0, 0.0, 1.0));

  vColor = finalColor;
  vAlpha = aLife;

  // 10. Project
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vFogDepth = -mvPosition.z;

  float sizeScale = uPointScale * (300.0 / -mvPosition.z);
  float sparkle = uAudioHigh * sin(uTime * 20.0 + aRandom.x * 100.0) * 0.5;
  gl_PointSize = aSize * sizeScale * (1.0 + uBeat * 0.15) * (1.0 + sparkle);
  gl_Position = projectionMatrix * mvPosition;
}
