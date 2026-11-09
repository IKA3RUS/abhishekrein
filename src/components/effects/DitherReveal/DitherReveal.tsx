import { useRef } from "react";

import {
  Preloader,
  type PreloaderHandle,
} from "@/components/effects/Preloader";

import { usePreloader } from "./hooks/usePreloader";
import { useReveal } from "./hooks/useReveal";
import { useRouteReveal } from "./hooks/useRouteReveal";

/**
 * Dissolves the preloader cover out and each new route in with dithered noise rendered in WebGL.
 * Reads the CSS-animated --cover value every frame for timing.
 * Masks the new route with a low-resolution copy of the noise because CSS cannot mask with a live canvas.
 */
function DitherReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<PreloaderHandle>(null);
  const reveal = useReveal(canvasRef);
  const { cover, preloader } = usePreloader({
    coverRef,
    preloaderRef,
    ...reveal,
  });
  useRouteReveal(reveal);

  return (
    <>
      <div
        ref={coverRef}
        aria-hidden
        data-state={cover}
        className="pointer-events-none fixed inset-0 z-99 animate-preloader-fallback bg-white in-data-preloader-seen:hidden data-[state=done]:hidden data-[state=holding]:animate-none data-[state=revealing]:animate-uncover data-[state=revealing]:bg-transparent motion-reduce:hidden noscript:hidden"
      />
      <Preloader ref={preloaderRef} state={preloader} />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-100 size-full [image-rendering:pixelated] [view-transition-name:dither-reveal]"
      />
    </>
  );
}

export { DitherReveal };
