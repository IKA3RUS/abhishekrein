// Light shafts. Accumulates opening coverage along the ray from each pixel to
// the sun, with linear falloff over uLength.
uniform sampler2D uOpenings;
uniform vec2 uSun;
uniform float uAspect;
uniform float uLength;
uniform float uStrength;
varying vec2 vUv;

void main() {
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 toSun = (uSun - vUv) * aspect;
  float distance = length(toSun);
  vec2 direction = toSun / max(distance, 1e-4) / aspect;
  float reach = min(uLength, distance);

  // Per-pixel sample jitter. Replaces step banding with noise for the Dither pass.
  float jitter = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);

  float light = 0.0;
  for (int i = 0; i < 32; i++) {
    float s = (float(i) + jitter) / 32.0 * reach;
    light += texture2D(uOpenings, vUv + direction * s).r * (1.0 - s / uLength);
  }
  light *= uStrength / 32.0;

  // The Dither pass reads the blue channel as unshaded light.
  gl_FragColor = vec4(0.0, 0.0, 1.0, clamp(light, 0.0, 1.0));
}
