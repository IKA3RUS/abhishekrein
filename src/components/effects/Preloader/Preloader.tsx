import { type Ref, useRef } from "react";

import { ScriptOnce } from "@tanstack/react-router";

import figureUrl from "./assets/figure.svg?url";
import Landing from "./assets/landing.svg?react";
import Still from "./assets/still.svg?react";
import { useFigureColor } from "./hooks/useFigureColor";
import {
  type PreloaderHandle,
  usePreloaderHandle,
} from "./hooks/usePreloaderHandle";
import { markPreloaderSeen, watchPreloaderFigure } from "./utils";

/** Skips markPreloaderSeen in development. Runs before first paint. */
function PreloaderScript() {
  const scripts = import.meta.env.PROD
    ? [watchPreloaderFigure, markPreloaderSeen]
    : [watchPreloaderFigure];
  return (
    <ScriptOnce>
      {scripts.map((script) => `(${script.toString()})();`).join("")}
    </ScriptOnce>
  );
}

function Preloader({
  state,
  ref,
}: {
  state: string;
  ref?: Ref<PreloaderHandle>;
}) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);
  usePreloaderHandle(ref, preloaderRef, objectRef);
  useFigureColor(objectRef, state);

  return (
    <div
      ref={preloaderRef}
      aria-hidden
      data-state={state}
      className="preloader group pointer-events-none fixed inset-0 z-101 grid animate-preloader-fallback place-items-center transition-[--preloader-shake] duration-[calc(var(--preloader-land)*0.4)] ease-out in-[[data-preloader-seen]]:hidden data-[state=done]:hidden data-[state=holding]:animate-none data-[state=landing]:animate-preloader-exit data-[state=landing]:[--preloader-shake:0] data-[state=revealing]:animate-none motion-reduce:hidden noscript:hidden"
    >
      <div className="relative size-10 text-violet-7">
        {/* Marks the exit start for aimExit. */}
        <Landing className="absolute inset-0 overflow-visible" />
        <div className="absolute inset-0 origin-top-left animate-preloader-flight">
          <div className="absolute inset-0 origin-top-left animate-preloader-shake">
            {/* Shows the first frame until figure.svg loads. */}
            <Still className="absolute inset-0 overflow-visible fill-current in-[[data-preloader-figure]]:hidden" />
            {/* Matches the figure.svg viewBox. */}
            <object
              ref={objectRef}
              data={figureUrl}
              type="image/svg+xml"
              tabIndex={-1}
              className="preloader-object pointer-events-none absolute -top-4 -left-2 size-14"
            />
          </div>
        </div>
      </div>
      <div
        lang="ja"
        className="absolute inset-x-0 top-[calc(50%+56px)] mx-auto w-30 animate-preloader-caption typography-text-3 text-violet-7 group-data-[state=landing]:animate-preloader-caption-out"
      >
        <p>
          <span className="text-[15px] leading-none font-medium">「</span>
          そして自らの
        </p>
        <p className="flex">
          <span className="grow">技芸を</span>
          <span>
            呪った
            <span className="text-[15px] leading-none font-medium">」</span>
          </span>
        </p>
      </div>
      {/* Shows that the page is still loading. */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 typography-text-3 text-violet-7 group-data-[state=landing]:animate-preloader-caption-out">
        <div className="flex animate-preloader-dots gap-2">
          <span>•</span>
          <span>•</span>
          <span>•</span>
        </div>
      </div>
    </div>
  );
}

export { Preloader, PreloaderScript };
