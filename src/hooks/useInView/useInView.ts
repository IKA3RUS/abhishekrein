import { useEffect, useState } from "react";

interface UseInViewOptions {
  /**
   * CSS margin string (e.g. `"100px"`, `"10% 0px"`) that expands or shrinks
   * the detection boundary relative to the viewport. Positive values cause the
   * element to be considered "in view" before it actually enters the viewport.
   * Follows the same syntax as the CSS `margin` shorthand.
   * @default "0px"
   */
  margin?: string;
  /**
   * Fraction of the element that must be visible before it is considered in
   * view. `0` means any visible pixel; `1` means fully visible.
   * @default 0
   */
  threshold?: number | number[];
  /**
   * When `true`, stops observing after the first intersection, so the returned
   * value latches to `true` and never resets.
   * @default false
   */
  once?: boolean;
}

/**
 * Tracks whether an element is within (or near) the viewport using
 * IntersectionObserver.
 *
 * @param ref - Ref attached to the element to observe.
 * @param options - Configuration for the intersection detection.
 * @returns `true` when the element meets the intersection criteria.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const inView = useInView(ref, { margin: "200px", once: true });
 * return <div ref={ref}>{inView ? "visible" : "hidden"}</div>;
 */
export function useInView<T extends Element>(
  ref: React.RefObject<T | null>,
  options: UseInViewOptions = {},
): boolean {
  const { margin = "0px", threshold = 0, once = false } = options;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin: margin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin, threshold, once]);

  return inView;
}
