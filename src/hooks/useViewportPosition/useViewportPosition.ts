import { type RefObject, useEffect, useRef } from "react";

/**
 * Returns the element's position and size in viewport coordinates, measured
 * on scroll and resize rather than on every read. Read it in event or frame
 * callbacks, not during render.
 */
export function useViewportPosition(ref: RefObject<Element | null>) {
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      rectRef.current = element.getBoundingClientRect();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return rectRef;
}
