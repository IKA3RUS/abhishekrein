import { useEffect, useImperativeHandle, useRef } from "react";

import type Hls from "hls.js";

import { useInView } from "@/hooks/useInView";

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  ref?: React.Ref<HTMLVideoElement>;
  src: string;
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

  const isHls = src.endsWith(".m3u8");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.src || hlsRef.current) return;
    if (deferred || (lazy && !inView)) return;

    let cancelled = false;

    if (isHls && !video.canPlayType("application/vnd.apple.mpegurl")) {
      import("hls.js/light")
        .then(({ default: Hls }) => {
          if (cancelled || !Hls.isSupported()) return;
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
        })
        .catch(() => {});
    } else {
      video.src = src;
      video.load();
      video.play().catch(() => {});
    }

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [deferred, inView, src, lazy, isHls]);

  return (
    <video
      ref={videoRef}
      preload={lazy ? "none" : "auto"}
      loop={loop}
      muted
      playsInline
      tabIndex={-1}
      {...props}
    />
  );
}

export { Video };
