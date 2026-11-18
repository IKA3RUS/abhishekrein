import type { Vector3 } from "three";

// Free of runtime imports, so the home route can import CLOUD_URL to preload
// the texture without pulling in three
export const CLOUD_URL = "/images/home/cloud.webp";

// Stream function of the eddy field as a sum of plane waves. The velocity is
// its curl, so the flow neither gathers nor spreads the segments.
const EDDIES = [
  { kx: 0.35, ky: 0.55, w: 0.07, a: 0.12, phase: 0 },
  { kx: -0.5, ky: 0.3, w: -0.05, a: 0.1, phase: 1.3 },
  { kx: 0.9, ky: -0.8, w: 0.11, a: 0.04, phase: 2.1 },
];

/** Wind speed factor at x, as gust bands pass through at 0.6 units per second */
export function gustAt(x: number, t: number, gust: number) {
  const s = x - t * 0.6;
  return 1 + gust * (0.6 * Math.sin(0.12 * s) + 0.4 * Math.sin(0.31 * s + 1.7));
}

/**
 * Writes the eddy velocity at (x, y) into out.x and out.y. The eddies are
 * carried along by the mean wind.
 */
export function eddyAt(
  x: number,
  y: number,
  t: number,
  wind: number,
  out: Vector3,
) {
  out.set(0, 0, 0);
  const carried = x - wind * t;
  for (const e of EDDIES) {
    const theta = e.kx * carried + e.ky * y + e.w * t + e.phase;
    const c = e.a * Math.cos(theta);
    out.x += e.ky * c;
    out.y -= e.kx * c;
  }
  return out;
}
