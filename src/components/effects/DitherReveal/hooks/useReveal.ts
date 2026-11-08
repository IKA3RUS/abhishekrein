import { type RefObject, useCallback, useRef } from "react";

import { type Reveal, createReveal } from "../reveal";

const MASK_SCALE = 8; // Cells per mask pixel.

interface Mask {
  canvas: HTMLCanvasElement;
  reveal: Reveal;
  style: HTMLStyleElement;
}

/** Creates the renderers on first use and draws them in step with CSS animations. */
function useReveal(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const revealRef = useRef<Reveal | null>(null);
  const maskRef = useRef<Mask | null>(null);
  const frameRef = useRef(0);

  const getReveal = useCallback(() => {
    revealRef.current ??= createReveal(canvasRef.current!, "fill");
    return revealRef.current;
  }, [canvasRef]);

  const getMask = useCallback(() => {
    if (!maskRef.current) {
      const canvas = document.createElement("canvas");
      const reveal = createReveal(canvas, "mask", MASK_SCALE);
      if (!reveal) return null;
      const style = document.createElement("style");
      document.head.append(style);
      maskRef.current = { canvas, reveal, style };
    }
    return maskRef.current;
  }, []);

  /** Draws each frame until the animation finishes. */
  const follow = useCallback(
    (
      animation: Animation,
      read: () => number,
      onFrame?: (time: number) => void,
    ) => {
      const reveal = getReveal();
      cancelAnimationFrame(frameRef.current);

      return new Promise<void>((resolve) => {
        const tick = (time: number) => {
          if (
            animation.playState === "finished" ||
            animation.playState === "idle"
          ) {
            reveal?.clear();
            resolve();
            return;
          }
          reveal?.draw(read(), time);
          onFrame?.(time);
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      });
    },
    [getReveal],
  );

  const stop = useCallback(() => cancelAnimationFrame(frameRef.current), []);

  return { getReveal, getMask, follow, stop };
}

type RevealControls = ReturnType<typeof useReveal>;

export { type RevealControls, useReveal };
