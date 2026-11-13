import { useEffect } from "react";

import { useRouter } from "@tanstack/react-router";

import { usePreloaderDone } from "@/components/effects/Preloader";

import { type Playback, useSound } from "@/hooks/useSound";

import { SOUNDS, VOLUME } from "../sounds";
import { TRANSITION_PSEUDO, findViewTransition, readCover } from "../utils";
import type { RevealControls } from "./useReveal";

const MAX_IGNITION_FRAMES = 600; // Ignition frame limit for a navigation that never starts a view transition.
const CLICK_WINDOW = 1000; // Maximum interval in ms between a press and navigation for the press to set the origin.
const SMOULDER_IN = 0.15; // Fade-in in seconds, which masks the discontinuity of a random loop offset.
const SMOULDER_OUT = 0.9; // Fade-out in seconds under the burn, matched to the onset of burn.mp3 at about 0.7s.

/** Resolves the burn origin in CSS px: the recent press, else the centre of the focused anchor, else the viewport centre. */
function navigationOrigin(press: { x: number; y: number; time: number }) {
  if (performance.now() - press.time < CLICK_WINDOW) return press;
  const focused = document.activeElement;
  if (focused instanceof HTMLAnchorElement) {
    const rect = focused.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** Dissolves the new page in over the old one on every route change. */
function useRouteReveal({
  getReveal,
  getMask,
  follow,
}: Pick<RevealControls, "getReveal" | "getMask" | "follow">) {
  const router = useRouter();
  // Defers fetching until the preloader completes, to avoid contending for bandwidth.
  const { play } = useSound(SOUNDS, {
    volume: VOLUME,
    preload: usePreloaderDone(),
  });

  useEffect(() => {
    const press = { x: 0, y: 0, time: -Infinity };
    const onPointerDown = (event: PointerEvent) => {
      press.x = event.clientX;
      press.y = event.clientY;
      press.time = performance.now();
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });

    let navigation = 0;
    let smoulder: Playback | null = null;

    const unsubscribe = router.subscribe("onBeforeLoad", ({ pathChanged }) => {
      if (!pathChanged) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const reveal = getReveal();
      const mask = getMask();
      if (!reveal || !mask) return;

      // Clears the final mask rule of the previous transition.
      mask.style.textContent = "";

      // Ignites immediately, so that the scorch develops while the next route loads.
      const origin = navigationOrigin(press);
      const seed = Math.random() * 100;
      reveal.setMode("frontier");
      for (const renderer of [reveal, mask.reveal]) {
        renderer.setSeed(seed);
        renderer.ignite(origin.x, origin.y);
      }
      const current = ++navigation;
      smoulder?.stop(0.1);
      play("ignite");
      smoulder = play("smoulder", {
        loop: true,
        fadeIn: SMOULDER_IN,
        offset: "random",
      });

      // Polls because the view transition starts only once the next route loads.
      let attempts = 0;
      const waitForTransition = (time: number) => {
        if (current !== navigation) return;
        const animation = findViewTransition();
        if (!animation) {
          if (attempts++ < MAX_IGNITION_FRAMES) {
            reveal.draw(0, time);
            requestAnimationFrame(waitForTransition);
          } else {
            reveal.clear();
            smoulder?.stop(0.3);
          }
          return;
        }

        play("burn");
        smoulder?.stop(SMOULDER_OUT);

        // Alternates two mask layers so a data URL that is still decoding never leaves the new page unmasked.
        let layer = 0;
        const masks = ["none", "none"];
        const read = () =>
          readCover(document.documentElement, TRANSITION_PSEUDO);

        follow(animation, read, (time) => {
          mask.reveal.draw(read(), time);
          masks[layer] = `url(${mask.canvas.toDataURL()})`;
          layer = 1 - layer;
          mask.style.textContent = `::view-transition-new(root) { mask-image: ${masks.join(", ")}; }`;
        }).then(() => {
          // Keeps the new page unmasked for the extra frame the transition renders after the animation ends.
          mask.style.textContent =
            "::view-transition-new(root) { mask-image: none; }";
        });
      };
      requestAnimationFrame(waitForTransition);
    });

    return () => {
      unsubscribe();
      smoulder?.stop(0.3);
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
    };
  }, [router, play, follow, getReveal, getMask]);
}

export { useRouteReveal };
