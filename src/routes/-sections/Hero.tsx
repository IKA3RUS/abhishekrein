import { useRef } from "react";
import { AnimatedBeam } from "@/components/AnimatedBeam";

function Hero() {
  const animatedBeamContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="min-h-dvh w-full bg-violet-7 flex flex-col items-center justify-center">
      <div
        className="size-full relative flex items-center justify-center typography-display-2 text-neutral-11"
        ref={animatedBeamContainerRef}
      >
        <span className="-translate-y-1/2">abhishek</span>
        <AnimatedBeam
          className="-top-54"
          containerRef={animatedBeamContainerRef}
        />
        <AnimatedBeam
          className="-top-44"
          containerRef={animatedBeamContainerRef}
        />
        <AnimatedBeam
          className="-top-19"
          containerRef={animatedBeamContainerRef}
        />
        <span>rein</span>
        <AnimatedBeam
          className="-top-6"
          containerRef={animatedBeamContainerRef}
        />
        <AnimatedBeam
          className="top-19"
          containerRef={animatedBeamContainerRef}
        />
      </div>
      <div className="flex -ml-34 flex-col gap-4 typography-text-1 text-neutral-11">
        <span className="">I create human-centered eye-candy</span>
        <span className="">アビシェク レイン</span>
      </div>
    </div>
  );
}

export { Hero };
