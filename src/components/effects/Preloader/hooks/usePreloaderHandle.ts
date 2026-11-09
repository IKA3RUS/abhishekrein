import { type Ref, type RefObject, useImperativeHandle } from "react";

import { aimExit, cssAnimationsFinished, figureRoot } from "../utils";

interface PreloaderHandle {
  /** Resolves when the entrance animations finish. */
  entered(): Promise<void>;
  /** Aims the exit at the header logo and starts the landing on the next beat. Resolves when the landing begins. */
  land(): Promise<void>;
  /** Resolves when the exit animation finishes. */
  exited(): Promise<void>;
}

/** Exposes the PreloaderHandle that DitherReveal uses to sequence the preloader. */
function usePreloaderHandle(
  ref: Ref<PreloaderHandle> | undefined,
  preloaderRef: RefObject<HTMLDivElement | null>,
  objectRef: RefObject<HTMLObjectElement | null>,
) {
  useImperativeHandle(ref, () => ({
    entered() {
      return cssAnimationsFinished(preloaderRef.current!, [
        "preloader-flight",
        "preloader-caption",
      ]);
    },
    land() {
      aimExit(preloaderRef.current!);
      const root = figureRoot(objectRef.current);
      if (!root) return Promise.resolve();
      const loop = root.querySelector<SVGAnimationElement>("[repeatCount]")!;
      const start = loop.getStartTime();
      const beat = loop.getSimpleDuration();
      const time = root.getCurrentTime();
      const at = start + beat * Math.max(Math.ceil((time - start) / beat), 0);
      const animations = root.querySelectorAll<SVGAnimationElement>(".land");
      const started = new Promise<void>((resolve) =>
        animations[0].addEventListener("beginEvent", () => resolve(), {
          once: true,
        }),
      );
      // Begins after the loop so the landing takes priority. The extra 1ms keeps Chrome's float rounding from placing it before the loop's start.
      animations.forEach((animation) =>
        animation.beginElementAt(at - time + 0.001),
      );
      return started;
    },
    exited() {
      return cssAnimationsFinished(preloaderRef.current!, ["preloader-exit"]);
    },
  }));
}

export { type PreloaderHandle, usePreloaderHandle };
