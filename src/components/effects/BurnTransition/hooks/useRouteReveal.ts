import { useEffect } from "react";

import { useRouter } from "@tanstack/react-router";

import { usePreloaderDone } from "@/components/effects/Preloader";

import { type Playback, useSound } from "@/hooks/useSound";
import { prefersReducedMotion } from "@/lib/reduced-motion";

import { SOUNDS } from "../sounds";
import { TRANSITION_PSEUDO, findViewTransition, readCover } from "../utils";
import type { RevealControls } from "./useReveal";

/** Resolves the burn origin in CSS px. Uses a press within the last second, else the centre of the focused anchor, else the viewport centre. */
function navigationOrigin(press: { x: number; y: number; time: number }) {
  if (performance.now() - press.time < 1000) return press;
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
    volume: 0.5,
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
      if (prefersReducedMotion()) return;
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
        // Masks the discontinuity of a random loop offset
        fadeIn: 0.15,
        offset: "random",
      });

      // Polls because the view transition starts only once the next route loads.
      let attempts = 0;
      const waitForTransition = (time: number) => {
        if (current !== navigation) return;
        const animation = findViewTransition();
        if (!animation) {
          // Gives up on a navigation that never starts a view transition
          if (attempts++ < 600) {
            reveal.draw(0, time);
            requestAnimationFrame(waitForTransition);
          } else {
            reveal.clear();
            smoulder?.stop(0.3);
          }
          return;
        }

        play("burn");
        // Matched to the onset of burn.mp3 at about 0.7s
        smoulder?.stop(0.9);

        // Cycles five mask layers, so each data URL stays for five frames and one that is still loading never leaves the new page unmasked.
        let layer = 0;
        const masks = Array<string>(5).fill("none");
        const read = () =>
          readCover(document.documentElement, TRANSITION_PSEUDO);

        follow(animation, read, (time) => {
          mask.reveal.draw(read(), time);
          masks[layer] = `url(${mask.canvas.toDataURL()})`;
          layer = (layer + 1) % 5;
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
