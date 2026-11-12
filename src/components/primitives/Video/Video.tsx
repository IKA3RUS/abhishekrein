import { useEffect, useImperativeHandle, useRef } from "react";

import Hls from "hls.js";

import { useInView } from "@/hooks/useInView";

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  ref?: React.Ref<HTMLVideoElement>;
  src: string;
  lazy?: boolean;
  lazyThresholdPx?: number;
  loop?: boolean;
  /** Holds off loading while true. */
  deferred?: boolean;
}

function Video({
  ref,
  src,
  lazy = true,
  lazyThresholdPx = 300,
  loop = true,
  deferred = false,
  ...props
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  useImperativeHandle(ref, () => videoRef.current!, []);
  const inView = useInView(videoRef, {
    margin: `${lazyThresholdPx}px`,
    once: true,
  });

  const isHls = src.endsWith(".m3u8");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.src || hlsRef.current) return;
    if (deferred || (lazy && !inView)) return;

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.load();
        video.play().catch(() => {});
      }
    } else {
      video.src = src;
      video.load();
      video.play().catch(() => {});
    }

    return () => {
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
