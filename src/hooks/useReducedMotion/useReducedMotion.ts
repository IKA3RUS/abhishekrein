import { useSyncExternalStore } from "react";

import {
  REDUCED_MOTION_QUERY,
  prefersReducedMotion,
} from "@/lib/reduced-motion";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Returns whether the user prefers reduced motion, updating when the preference changes. Returns false during server rendering. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
