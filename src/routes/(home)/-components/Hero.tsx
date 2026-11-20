import { Suspense, lazy, useCallback, useRef, useState } from "react";

import { ClientOnly } from "@tanstack/react-router";

import { EmailButton } from "@/components/composites/EmailButton";

import { AnimatedTypographyBeams } from "@/components/effects/AnimatedTypographyBeams";

import AscentFallIka3rusMicrographic from "@/assets/home/ascent-fall-ika3rus.svg?react";

const HeroScene = lazy(() => import("./HeroScene.client"));

function Hero() {
  const [sceneShown, setSceneShown] = useState(false);
  const onSceneShown = useCallback(() => setSceneShown(true), []);
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      // Holds the preloader until the clouds have faded in
      data-preloader-hold={sceneShown ? undefined : ""}
      // Scrolls for an extra --hero-scroll with the scene pinned
      className="relative h-[calc(100dvh+var(--hero-scroll))] w-full bg-violet-7"
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-linear-to-b from-white/0 via-white via-30% to-white"
        />
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <HeroScene section={sectionRef} onShown={onSceneShown} />
          </Suspense>
        </ClientOnly>
      </div>
      <div className="absolute inset-x-0 top-0 flex h-dvh flex-col items-center justify-center">
        <AnimatedTypographyBeams className="relative flex w-full flex-col items-center justify-center overflow-x-clip md:flex-row">
          <span className="z-1 translate-y-1/3 typography-display-4 text-neutral-11 transition-[font-size] md:-translate-y-1/2 xl:typography-display-3">
            abhishek
          </span>
          <span className="z-1 bg-violet-3/0 typography-display-4 text-neutral-11 xl:typography-display-3">
            rein
          </span>
        </AnimatedTypographyBeams>
        <div className="z-1 flex flex-col gap-0 typography-text-2 text-neutral-11 transition-[margin-left,gap] md:-ml-34 md:gap-4 md:typography-text-1">
          <div className="relative z-1 w-full">
            <p>creates human-centered eye candy</p>
            <p className="flex">
              <span className="inline-flex grow">with</span>
              <span>structured thinking</span>
            </p>
            <p className="flex">
              <span className="inline-flex grow">for multi-dimensional</span>
              <span>problems.</span>
            </p>
          </div>
          <span className="">アビシェク レイン</span>
          <EmailButton className="mt-8 md:mt-2" />
        </div>
        <AscentFallIka3rusMicrographic className="absolute right-4 bottom-4 z-1" />
      </div>
    </section>
  );
}

export { Hero };
