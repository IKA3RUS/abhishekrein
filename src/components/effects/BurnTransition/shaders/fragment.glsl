// Uses highp because the hash overflows in 16-bit mediump on mobile GPUs.
precision highp float;

uniform float burn; // Burn progress, 0 to 1.
uniform float time; // Seconds since ignite().
uniform float seed;
uniform float scale;
uniform float mode; // 0 is frontier and fill, 1 is frontier only, 2 is a soft mask, 3 is a heat displacement map, 4 is a heat haze map.
uniform vec2 origin; // Burn origin, in cells from the bottom left.
uniform vec2 resolution; // Viewport size, in cells.
uniform vec3 fill;
uniform vec3 frontier;
uniform vec3 ember;

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

// Uses the same 4x4 matrix as the hero Dither pass in src/components/effects/Dither/shaders/dither.glsl.
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

  // Distance from the origin, normalised to 0 at the nearest viewport point and 1 at the farthest corner.
  vec2 offset = cell - origin;
  float near = length(max(vec2(0.0), max(-origin, origin - resolution)));
  float far = length(max(abs(origin), abs(resolution - origin)));
  float reach = (length(offset) - near) / (far - near);

  // Drifting fbm term that fragments the front into holes, ramped in with distance so that the origin burns first.
  vec2 drift = vec2(time * 0.15, -time * 0.1);
  float holes = clamp((fbm(cell * 0.012 + seed + drift) - 0.25) / 0.5, 0.0, 1.0);
  holes *= smoothstep(0.0, 0.25, reach);

  // Fbm advected away from the origin, which forms tongues along the front.
  // Attenuates advection near the origin, where the radial field converges into a pinwheel artefact.
  vec2 outward = offset / max(length(offset), 1.0);
  outward *= smoothstep(0.0, 80.0, length(offset));
  float flame = fbm(cell * 0.01 + seed * 1.7 - outward * time * 1.2);

  // Weights the holes by 0.6 and the tongues by 0.25, in order units.
  float order = (reach + 0.6 * holes + 0.25 * (flame - 0.5)) / 1.6;
  order = clamp(order, 0.0, 1.0);

  // The frontier is a smoothstep of half-width 0.04 in order units.
  float burnThreshold = mix(-0.04, 1.04, burn);

  // Displacement map for the old page, read by an SVG feDisplacementMap. Red and green carry x and y offsets around 0.5.
  // Within 0.08 ahead of the front the page is pulled toward the fire by 0.3, as paper shrinks when it chars, and shimmers with rising heat by 0.6, both as shares of the displacement range.
  if (mode > 2.5) {
    float ahead = order - burnThreshold;
    float heat = (1.0 - smoothstep(0.0, 0.08, ahead)) * smoothstep(-0.04, 0.0, ahead);
    heat *= smoothstep(0.0, 0.3, time);
    vec2 rising = cell * 0.03 + seed + vec2(0.0, -time * 4.0);
    // Haze map. Draws the heat as alpha, flickering with the rising noise.
    if (mode > 3.5) {
      gl_FragColor = vec4(heat * (0.6 + 0.8 * noise(rising)));
      return;
    }
    vec2 shimmer = vec2(noise(rising), noise(rising + 17.0)) - 0.5;
    vec2 displacement = heat * (outward * 0.3 + shimmer * 0.6);
    // Flips y, since SVG offsets point down.
    gl_FragColor = vec4(0.5 + displacement.x, 0.5 - displacement.y, 0.5, 1.0);
    return;
  }

  if (mode > 1.5) {
    gl_FragColor = vec4(smoothstep(order - 0.04, order + 0.04, burnThreshold));
    return;
  }

  // Per-cell hash grain, reseeded at 24 Hz, for a ragged and flickering frontier.
  order = mix(order, hash(cell + seed + floor(time * 24.0)), 0.12);
  float burnt = smoothstep(order - 0.04, order + 0.04, burnThreshold);
  if (burnt >= 1.0) discard;

  float dither = ditherThreshold(cell);
  if (burnt > dither) {
    gl_FragColor = vec4(frontier, 1.0);
    return;
  }

  // Scorch layer. An fbm-perturbed disc that grows to 0.08 of the reach after ignition, then leads the burn threshold by 0.06.
  // It dithers to at most 0.45 density.
  float crackle = hash(cell + seed + floor(time * 24.0)) - 0.5;
  float kindling = reach * (1.0 + 2.0 * (flame - 0.5)) + 0.03 * crackle;
  float kindled = 0.08 * (1.0 - exp(-time * 2.5));
  float ignited = smoothstep(kindling - 0.02, kindling + 0.02, kindled);
  float heat = burn + 0.06 * smoothstep(0.0, 0.1, burn);
  float scorched = max(ignited, smoothstep(order - 0.08, order + 0.08, heat));
  if (scorched * 0.45 > dither) {
    gl_FragColor = vec4(ember, 1.0);
    return;
  }

  if (mode > 0.5) discard;
  gl_FragColor = vec4(fill, 1.0);
}
