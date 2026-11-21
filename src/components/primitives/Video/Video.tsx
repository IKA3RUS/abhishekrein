import { useEffect, useImperativeHandle, useRef } from "react";

import type Hls from "hls.js";

import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Types checked with `canPlayType()`, by file extension. A `.mov` is assumed to hold HEVC with alpha, which only Safari renders; other browsers report no QuickTime support. */
const SOURCE_TYPES: Record<string, string> = {
  mov: 'video/quicktime; codecs="hvc1"',
  mp4: "video/mp4",
  webm: "video/webm",
};

/** Returns the first source the browser can play, falling back to the last. HLS streams always count as playable, through hls.js where native support is missing. */
function pickSource(video: HTMLVideoElement, sources: string[]) {
  return (
    sources.find((source) => {
      if (source.endsWith(".m3u8")) return true;
      const type = SOURCE_TYPES[source.split(".").pop()!.toLowerCase()];
      return !type || video.canPlayType(type) !== "";
    }) ?? sources[sources.length - 1]
  );
}

interface VideoProps extends Omit<
  React.VideoHTMLAttributes<HTMLVideoElement>,
  "src"
> {
  ref?: React.Ref<HTMLVideoElement>;
  /** A source, or sources in order of preference. The first one the browser can play is used. */
  src: string | string[];
  lazy?: boolean;
  /** Element observed to trigger lazy loading. Defaults to the video element. */
  lazyTarget?: React.RefObject<Element | null>;
  /** Margin around the viewport used when observing `lazyTarget`. */
  lazyMargin?: string;
  loop?: boolean;
  /** Holds off loading while true. */
  deferred?: boolean;
}

function Video({
  ref,
  src,
  lazy = true,
  lazyTarget,
  lazyMargin = "300px",
  loop = true,
  deferred = false,
  ...props
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  useImperativeHandle(ref, () => videoRef.current!, []);
  const inView = useInView(lazyTarget ?? videoRef, {
    margin: lazyMargin,
    once: true,
  });
  const reducedMotion = useReducedMotion();

  // A string key keeps the effect stable when an array literal is passed on each render.
  const sourcesKey = typeof src === "string" ? src : src.join("\n");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.src || hlsRef.current) return;
    if (deferred || (lazy && !inView)) return;

    let cancelled = false;
    const source = pickSource(video, sourcesKey.split("\n"));

    if (
      source.endsWith(".m3u8") &&
      !video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      import("hls.js/light")
        .then(({ default: Hls }) => {
          if (cancelled || !Hls.isSupported()) return;
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(source);
          hls.attachMedia(video);
        })
        .catch(() => {});
    } else {
      video.src = source;
      video.load();
    }

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [deferred, inView, sourcesKey, lazy]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video?.currentSrc) return;
    if (reducedMotion) video.pause();
    else video.play().catch(() => {});
  }, [reducedMotion]);

  return (
    <video
      ref={videoRef}
      autoPlay={!reducedMotion}
      preload={lazy && !reducedMotion ? "none" : "auto"}
      loop={loop}
      muted
      playsInline
      tabIndex={-1}
      {...props}
    />
  );
}

export { Video };
