import { type RefObject, useEffect, useState } from "react";

import {
  type PreloaderHandle,
  preloaderSeen,
} from "@/components/effects/Preloader";

import { readCover, waitForPreloaderHolds } from "../utils";
import type { RevealControls } from "./useReveal";

type CoverState = "waiting" | "holding" | "revealing" | "done";

/** Holds the cover until the page is ready, lands the figure, then dissolves the cover. Returns the states for the cover and <Preloader />. */
function usePreloader({
  coverRef,
  preloaderRef,
  getReveal,
  follow,
  stop,
}: Pick<RevealControls, "getReveal" | "follow" | "stop"> & {
  coverRef: RefObject<HTMLDivElement | null>;
  preloaderRef: RefObject<PreloaderHandle | null>;
}) {
  const [cover, setCover] = useState<CoverState>("waiting");
  const [landing, setLanding] = useState<"pending" | "landing" | "landed">(
    "pending",
  );

  useEffect(() => {
    const element = coverRef.current!;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Skips when seen this session, under reduced motion, without WebGL, or after the cover fallback ran.
    if (
      preloaderSeen() ||
      reducedMotion ||
      !getReveal() ||
      getComputedStyle(element).opacity === "0"
    ) {
      // Reads DOM and WebGL state, which is unavailable during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCover("done");
      return;
    }

    setCover("holding");
    let cancelled = false;

    Promise.all([waitForPreloaderHolds(), preloaderRef.current?.entered()])
      .then(() => preloaderRef.current?.land())
      .then(() => {
        if (cancelled) return;
        // Draws a fully covered frame before the CSS cover turns transparent.
        const reveal = getReveal()!;
        reveal.setMode("fill");
        reveal.setSeed(Math.random() * 100);
        reveal.draw(1, performance.now());
        setLanding("landing");
        setCover("revealing");
      });

    return () => {
      cancelled = true;
      stop();
    };
  }, [coverRef, preloaderRef, getReveal, stop]);

  useEffect(() => {
    if (cover !== "revealing") return;

    const element = coverRef.current!;
    const animation = element.getAnimations()[0];
    const finished = animation
      ? follow(animation, () => readCover(element))
      : Promise.resolve(getReveal()?.clear());
    finished.then(() => setCover("done"));
  }, [cover, coverRef, getReveal, follow]);

  useEffect(() => {
    if (landing !== "landing") return;
    let cancelled = false;
    (preloaderRef.current?.exited() ?? Promise.resolve()).then(
      () => !cancelled && setLanding("landed"),
    );
    return () => {
      cancelled = true;
    };
  }, [landing, preloaderRef]);

  const preloader =
    landing === "landing" ? "landing" : landing === "landed" ? "done" : cover;

  return { cover, preloader };
}

export { usePreloader };
