import { useEffect, useRef, useState } from "react";

interface UseShouldCollapseOptions {
  /** Pixel distance past the sticky pin point before collapsing. */
  collapseMargin?: number;
  /** Continuous upward scroll distance required before expanding. */
  expandMargin?: number;
}

export function useShouldCollapse<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  { collapseMargin = 200, expandMargin = 200 }: UseShouldCollapseOptions = {},
): boolean {
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const prevScrollY = useRef(0);
  const collapseThreshold = useRef<number | null>(null);
  const upwardDistance = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const naturalDocTop = el.getBoundingClientRect().top + window.scrollY;
    const stickyOffset = parseInt(getComputedStyle(el).top) || 0;
    collapseThreshold.current = naturalDocTop - stickyOffset + collapseMargin;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - prevScrollY.current;
      prevScrollY.current = currentY;

      if (delta < 0) {
        upwardDistance.current += -delta;
        if (upwardDistance.current >= expandMargin) {
          setShouldCollapse(false);
        }
      } else {
        upwardDistance.current = 0;
        if (
          collapseThreshold.current !== null &&
          currentY > collapseThreshold.current
        ) {
          setShouldCollapse(true);
        }
      }
    };

    prevScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, collapseMargin, expandMargin]);

  return shouldCollapse;
}
