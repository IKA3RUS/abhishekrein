import { useEffect } from "react";

import { useRouter } from "@tanstack/react-router";

import { TRANSITION_PSEUDO, findViewTransition, readCover } from "../utils";
import type { RevealControls } from "./useReveal";

/** Dissolves the new page in over the old one on every route change. */
function useRouteReveal({
  getReveal,
  getMask,
  follow,
}: Pick<RevealControls, "getReveal" | "getMask" | "follow">) {
  const router = useRouter();

  useEffect(() => {
    return router.subscribe("onBeforeLoad", ({ pathChanged }) => {
      if (!pathChanged) return;

      // Clears the final mask rule of the previous transition.
      const mask = getMask();
      if (mask) mask.style.textContent = "";

      // Polls because the view transition starts only once the next route loads.
      let attempts = 0;
      const waitForTransition = () => {
        const animation = findViewTransition();
        const reveal = getReveal();
        if (!animation || !reveal || !mask) {
          if (attempts++ < 180) requestAnimationFrame(waitForTransition);
          return;
        }

        const seed = Math.random() * 100;
        reveal.setMode("frontier");
        reveal.setSeed(seed);
        mask.reveal.setSeed(seed);

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
  }, [router, follow, getReveal, getMask]);
}

export { useRouteReveal };
