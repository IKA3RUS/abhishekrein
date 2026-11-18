// Steps the cut field with a 5-tap diffusion, exponential decay, and a capsule
// stamp along the pointer segment since the previous frame.
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uAspect;
uniform float uRadius;
uniform float uStrength;
uniform float uDecay;
varying vec2 vUv;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  float cut = texture2D(uPrev, vUv).r * 0.6
    + texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r * 0.1
    + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r * 0.1
    + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r * 0.1
    + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r * 0.1;
  cut *= uDecay;

  vec2 aspect = vec2(uAspect, 1.0);
  float d = segmentDistance(vUv * aspect, uFrom * aspect, uTo * aspect);
  float stroke = (1.0 - smoothstep(uRadius * 0.3, uRadius, d)) * uStrength;

  gl_FragColor = vec4(max(cut, stroke), 0.0, 0.0, 1.0);
}
