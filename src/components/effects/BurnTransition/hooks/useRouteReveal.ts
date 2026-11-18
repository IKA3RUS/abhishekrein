import { useEffect } from "react";

import { useRouter } from "@tanstack/react-router";

import { usePreloaderDone } from "@/components/effects/Preloader";

import { type Playback, useSound } from "@/hooks/useSound";
import { prefersReducedMotion } from "@/lib/reduced-motion";

import { SOUNDS } from "../sounds";
import { traceMask } from "../trace";
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
  getHeat,
  getQuality,
  follow,
}: Pick<
  RevealControls,
  "getReveal" | "getMask" | "getHeat" | "getQuality" | "follow"
>) {
  const router = useRouter();
  // Defers fetching until the preloader completes, to avoid contending for bandwidth.
  const preloaderDone = usePreloaderDone();
  const { play } = useSound(SOUNDS, {
    volume: 0.5,
    preload: preloaderDone,
  });

  // Creates the renderers and compiles their shaders while the browser is
  // idle, rather than on the first navigation.
  useEffect(() => {
    if (!preloaderDone || prefersReducedMotion()) return;
    const warm = () => {
      getMask();
      if (getQuality() === "full") getHeat();
    };
    if (typeof requestIdleCallback === "undefined") {
      const timeout = setTimeout(warm, 0);
      return () => clearTimeout(timeout);
    }
    const idle = requestIdleCallback(warm, { timeout: 2000 });
    return () => cancelIdleCallback(idle);
  }, [preloaderDone, getMask, getHeat, getQuality]);

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

      // Distorts the old page around the fire when available. Clip reveals
      // skip it, since the filter is as slow as the mask they replace.
      let clip = getQuality() === "clip";
      let heat = clip ? null : getHeat();

      // Clears the final rules of the previous transition.
      mask.style.textContent = "";
      heat?.reset();

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
        let pixels = new Uint8Array(0);
        const read = () =>
          readCover(document.documentElement, TRANSITION_PSEUDO);

        const dropHeat = () => {
          heat?.reset();
          heat = null;
        };

        follow(
          animation,
          read,
          (time, cover, measuring) => {
            // Switches to a clip reveal if follow() lowered the quality, but
            // only while the new page is still hidden.
            if (!clip && cover === 0 && getQuality() === "clip") {
              clip = true;
              dropHeat();
            }

            // Distorts only once the timing keeps the full reveal, so devices
            // that switch never apply it.
            if (heat && !measuring) {
              heat.reveal.setMode(heat.mode);
              heat.reveal.draw(cover, time);
              heat.update();
            }
            mask.reveal.setMode("mask");
            mask.reveal.draw(cover, time);

            // Clips the new page to the outline of the burnt area. Hides it
            // entirely while nothing has burnt.
            if (clip) {
              const { width, height } = mask.canvas;
              if (pixels.length !== width * height * 4) {
                pixels = new Uint8Array(width * height * 4);
              }
              mask.reveal.read(pixels);
              const path = traceMask(pixels, width, height, mask.cell);
              const shape = path ? `path(evenodd, "${path}")` : "inset(50%)";
              mask.style.textContent = `::view-transition-new(root) { mask-image: none; clip-path: ${shape}; }`;
              return;
            }

            masks[layer] = `url(${mask.canvas.toDataURL()})`;
            layer = (layer + 1) % 5;
            mask.style.textContent = `::view-transition-new(root) { mask-image: ${masks.join(", ")}; }`;
          },
          // Measures during the hold, while the new page is still hidden
          { measure: true },
        ).then(() => {
          // Keeps the new page unmasked for the extra frame the transition renders after the animation ends.
          mask.style.textContent =
            "::view-transition-new(root) { mask-image: none; }";
          dropHeat();
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
  }, [router, play, follow, getReveal, getMask, getHeat, getQuality]);
}

export { useRouteReveal };
