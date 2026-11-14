export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Returns whether the user prefers reduced motion. Must only be called on the client. */
export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
