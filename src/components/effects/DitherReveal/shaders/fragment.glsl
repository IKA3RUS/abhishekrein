// Uses highp because the hash overflows in 16-bit mediump on mobile GPUs.
precision highp float;

uniform float cover;
uniform float time;
uniform float seed;
uniform float scale;
uniform float mode; // 0 is frontier and fill, 1 is frontier only, 2 is a soft mask.
uniform vec3 fill;
uniform vec3 frontier;

const float EDGE = 0.08; // Frontier width in noise units.

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amplitude;
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Uses the same 4x4 matrix as the hero Dither pass in src/shaders/dither/DitherShader.ts.
float ditherThreshold(vec2 cell) {
  vec2 p = floor(mod(cell, 4.0));
  vec4 column = p.x < 0.5 ? vec4(16.0, 5.0, 13.0, 1.0)
    : p.x < 1.5 ? vec4(8.0, 12.0, 4.0, 9.0)
    : p.x < 2.5 ? vec4(14.0, 2.0, 15.0, 3.0)
    : vec4(6.0, 10.0, 7.0, 11.0);
  float threshold = p.y < 0.5 ? column.x
    : p.y < 1.5 ? column.y
    : p.y < 2.5 ? column.z
    : column.w;
  return threshold / 17.0;
}

void main() {
  vec2 cell = gl_FragCoord.xy * scale;

  // Orders pixels by drifting fbm, normalised to 0–1.
  vec2 drift = vec2(time * 0.15, -time * 0.1);
  float order = fbm(cell * 0.012 + seed + drift);
  order = clamp((order - 0.25) / 0.5, 0.0, 1.0);

  float threshold = mix(-EDGE, 1.0 + EDGE, cover);

  if (mode > 1.5) {
    gl_FragColor = vec4(smoothstep(order - EDGE, order + EDGE, threshold));
    return;
  }

  // Adds grain for a ragged frontier.
  order = mix(order, hash(cell + seed), 0.12);
  float covered = smoothstep(order - EDGE, order + EDGE, threshold);

  if (covered <= ditherThreshold(cell)) discard;
  if (covered >= 1.0) {
    if (mode > 0.5) discard;
    gl_FragColor = vec4(fill, 1.0);
    return;
  }
  gl_FragColor = vec4(frontier, 1.0);
}
