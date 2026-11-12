import { useLayoutEffect, useRef, useState } from "react";

import { usePreloaderDone } from "@/components/effects/Preloader";

import { Video } from "./Video";

/** Renders a Video that waits for the preloader to finish, which needs the bandwidth. One on screen at mount loads right away and holds the preloader until its first frame instead, so it doesn't pop in after the reveal. */
function DeferredVideo(
  props: Omit<React.ComponentProps<typeof Video>, "deferred" | "ref">,
) {
  const preloaderDone = usePreloaderDone();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  // Runs before the preloader's effect starts waiting on holds.
  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const { top, bottom } = video.getBoundingClientRect();
    if (bottom <= 0 || top >= window.innerHeight) return;

    // Set directly, so the hold exists in this commit rather than the next render.
    video.setAttribute("data-preloader-hold", "");
    const release = () => video.removeAttribute("data-preloader-hold");
    video.addEventListener("loadeddata", release, { once: true });
    video.addEventListener("error", release, { once: true });
    // Reads layout, which is unavailable during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnScreen(true);

    return () => {
      video.removeEventListener("loadeddata", release);
      video.removeEventListener("error", release);
      release();
    };
  }, []);

  return (
    <Video {...props} ref={videoRef} deferred={!preloaderDone && !onScreen} />
  );
}

export { DeferredVideo };
