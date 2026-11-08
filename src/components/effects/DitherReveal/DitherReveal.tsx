import { useRef } from "react";

import { useReveal } from "./hooks/useReveal";
import { useRouteReveal } from "./hooks/useRouteReveal";

/**
 * Dissolves each new route in with dithered noise rendered in WebGL.
 * Reads the CSS-animated --cover value every frame for timing.
 * Masks the new route with a low-resolution copy of the noise because CSS cannot mask with a live canvas.
 */
function DitherReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reveal = useReveal(canvasRef);
  useRouteReveal(reveal);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-100 size-full [image-rendering:pixelated] [view-transition-name:dither-reveal]"
    />
  );
}

export { DitherReveal };
