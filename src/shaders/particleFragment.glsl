varying vec3 vColor;
varying float vAlpha;
varying float vFogDepth;
varying float vHeat;  // ★ Energy heatmap from vertex shader

uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uHeartWarmth;

void main() {
  // Distance from center of point sprite
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Core (bright center) + soft glow (outer)
  float core = smoothstep(0.5, 0.05, d);
  float glow = smoothstep(0.5, 0.0, d) * 0.3;
  float alpha = (core + glow) * vAlpha;

  // Slight color tint at core (reduced to prevent blowout)
  vec3 color = vColor + core * 0.08;

  // Heartbeat warmth (Section 21B)
  color.r += uHeartWarmth;
  color.g -= uHeartWarmth * 0.3;

  // ★ Heat glow boost — subtle brightness near mouse
  color *= 1.0 + vHeat * 0.4;
  alpha *= 1.0 + vHeat * 0.15;

  // Exponential squared fog (Section 18A)
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  color = mix(color, uFogColor, fogFactor);
  alpha *= (1.0 - fogFactor * 0.6);

  gl_FragColor = vec4(color, alpha);
}
