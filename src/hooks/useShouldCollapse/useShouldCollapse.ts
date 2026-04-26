import { useEffect, useRef, useState } from "react";

interface UseShouldCollapseOptions {
  /**
   * Pixel distance past the sticky pin point before collapsing.
   * @default 200
   */
  margin?: number;
}

/**
 * Returns `true` when the user has scrolled `margin` px past the point where
 * the referenced element pins (becomes sticky), and `false` the moment they
 * scroll upward — regardless of current scroll position.
 *
 * The sticky `top` offset and natural document position are both derived from
 * the element itself, so no configuration beyond `margin` is needed.
 *
 * @param ref - Ref attached to the sticky element.
 * @param options - Configuration.
 */
export function useShouldCollapse<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  { margin = 200 }: UseShouldCollapseOptions = {},
): boolean {
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const prevScrollY = useRef(0);
  const threshold = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const naturalDocTop = el.getBoundingClientRect().top + window.scrollY;
    const stickyOffset = parseInt(getComputedStyle(el).top) || 0;
    threshold.current = naturalDocTop - stickyOffset + margin;

    const onScroll = () => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > prevScrollY.current;
      prevScrollY.current = currentY;

      if (!scrollingDown) {
        setShouldCollapse(false);
      } else if (threshold.current !== null && currentY > threshold.current) {
        setShouldCollapse(true);
      }
    };

    prevScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, margin]);

  return shouldCollapse;
}
