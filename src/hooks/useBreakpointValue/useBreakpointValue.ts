import { useSyncExternalStore } from "react";

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

type BreakpointMap<T> = Partial<Record<Breakpoint, T>> & { base: T };

const entries = Object.entries(breakpoints) as [Breakpoint, number][];

function subscribe(onChange: () => void) {
  const queries = entries.map(([, minWidth]) =>
    window.matchMedia(`(min-width: ${minWidth}px)`),
  );
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}

/** Returns the largest breakpoint the viewport reaches, so that renders happen only when a breakpoint is crossed. */
function getSnapshot(): Breakpoint | "base" {
  const width = window.innerWidth;
  return entries.findLast(([, minWidth]) => width >= minWidth)?.[0] ?? "base";
}

/** Returns the value for the largest breakpoint the viewport reaches, updating when a breakpoint is crossed. Returns `base` during server rendering and hydration. */
export function useBreakpointValue<T>(values: BreakpointMap<T>): T {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => "base");
  if (current === "base") return values.base;

  const reached = entries.slice(
    0,
    entries.findIndex(([bp]) => bp === current) + 1,
  );
  const resolved = reached
    .filter(([bp]) => bp in values)
    .reduce<T | undefined>((_, [bp]) => values[bp], undefined);

  return resolved ?? values.base;
}
