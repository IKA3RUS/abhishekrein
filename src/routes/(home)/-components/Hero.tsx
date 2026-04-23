import { Suspense, lazy } from "react";

import { ClientOnly } from "@tanstack/react-router";

import { AnimatedTypographyBeams } from "@/components/AnimatedTypographyBeams";
import { Button } from "@/components/Button";
import { useClipboard } from "@/hooks/useClipboard";

import AscentFallIka3rusMicrographic from "@/assets/home/ascent-fall-ika3rus.svg?react";
import PostFormCreativityMicrographic from "@/assets/home/post-form-creativity.svg?react";

import CopyAllIcon from "@material-symbols/svg-700/sharp/copy_all-fill.svg?react";
import LibraryAddCheckIcon from "@material-symbols/svg-700/sharp/library_add_check-fill.svg?react";
import MailIcon from "@material-symbols/svg-700/sharp/mail-fill.svg?react";

const HeroScene = lazy(() => import("./HeroScene.client"));

function EmailButton({ ...props }) {
  const { copy, isCopied } = useClipboard();

  const handleCopy = () => {
    copy("w@abhishekrein.xyz");
  };

  return (
    <Button onClick={handleCopy} {...props}>
      <MailIcon />
      w@abhishekrein.xyz
      {!isCopied ? (
        <CopyAllIcon
          data-icon="inline-end"
          className="fill-yellow-7! transition-[fill] duration-100 group-hover/button:fill-neutral-6! group-data-[tap=true]/button:fill-neutral-6!"
        />
      ) : (
        <LibraryAddCheckIcon
          data-icon="inline-end"
          className="fill-yellow-4!"
        />
      )}
    </Button>
  );
}

function Hero() {
  return (
    <section className="relative flex h-dvh w-full flex-col items-center justify-center bg-[linear-gradient(to_bottom,var(--color-violet-9)_0%,var(--color-violet-7)_15%,var(--color-violet-7)_95%,var(--color-white)_100%)]">
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </ClientOnly>
      <AnimatedTypographyBeams className="relative flex w-full flex-col items-center justify-center md:flex-row">
        <span className="z-1 translate-y-1/3 typography-display-4 text-neutral-11 transition-[font-size] md:-translate-y-1/2 md:typography-display-3 xl:typography-display-2">
          abhishek
        </span>
        <span className="z-1 bg-violet-3/0 typography-display-4 text-neutral-11 md:typography-display-3 xl:typography-display-2">
          rein
        </span>
      </AnimatedTypographyBeams>
      <div className="z-1 flex flex-col gap-0 typography-text-2 text-neutral-11 transition-[margin-left,gap] md:-ml-34 md:gap-4 md:typography-text-1">
        <span className="">I create human-centered eye-candy</span>
        <span className="">アビシェク レイン</span>
        <EmailButton className="mt-8 md:mt-2" />
      </div>
      <PostFormCreativityMicrographic className="absolute top-4 left-4 z-1" />
      <AscentFallIka3rusMicrographic className="absolute right-4 bottom-4 z-1" />
    </section>
  );
}

export { Hero };
