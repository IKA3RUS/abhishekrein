import { type RefObject, useEffect } from "react";

import { figureRoot } from "../utils";

/** Animates the figure color to --exit-fill while landing. Runs here because figure.svg does not inherit page styles. */
function useFigureColor(
  objectRef: RefObject<HTMLObjectElement | null>,
  state: string,
) {
  useEffect(() => {
    const root = figureRoot(objectRef.current);
    if (state !== "landing" || !root) return;
    const style = getComputedStyle(objectRef.current!);
    const to = style.getPropertyValue("--exit-fill");
    if (!to) return;
    root.animate(
      { color: `oklch(from ${to} l c h)` },
      {
        duration: parseFloat(style.getPropertyValue("--preloader-land")) * 1000,
        easing: style.getPropertyValue("--preloader-land-ease"),
        fill: "forwards",
      },
    );
  }, [objectRef, state]);
}

export { useFigureColor };
