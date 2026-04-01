import { useEffect, useState } from "react";

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

type BreakpointMap<T> = Partial<Record<Breakpoint, T>> & { base: T };

export function useBreakpointValue<T>(values: BreakpointMap<T>): T {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const resolved = (Object.entries(breakpoints) as [Breakpoint, number][])
    .filter(([bp, minWidth]) => bp in values && width >= minWidth)
    .reduce<T | undefined>((_, [bp]) => values[bp], undefined);

  return resolved ?? values.base;
}
