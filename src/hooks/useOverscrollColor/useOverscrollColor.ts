import { useEffect } from "react";

interface OverscrollColors {
  /** Colour while the upper half of the page is in view */
  top?: string;
  /** Colour while the lower half of the page is in view */
  bottom?: string;
}

/**
 * Colours the overscroll area with any CSS colour.
 */
export function useOverscrollColor({ top, bottom }: OverscrollColors) {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const max = root.scrollHeight - window.innerHeight;
      root.style.backgroundColor =
        (window.scrollY < max / 2 ? top : bottom) ?? "";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      root.style.backgroundColor = "";
    };
  }, [top, bottom]);
}
