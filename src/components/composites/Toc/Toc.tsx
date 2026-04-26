import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useHotkey } from "@tanstack/react-hotkeys";

import { AnimatePresence, motion } from "motion/react";

import {
  Button,
  ButtonHotkey,
  ButtonLabel,
  ButtonLeadingIcon,
  ButtonTrailingIcon,
} from "@/components/primitives/Button";

import { useBreakpointValue } from "@/hooks/useBreakpointValue";
import { useShouldCollapse } from "@/hooks/useShouldCollapse";
import { useSize } from "@/hooks/useSize";
import { cn } from "@/lib/cn";
import { type Toc as TocData } from "@/lib/remark-extract-toc";

import ChevronLineUpIcon from "@material-symbols/svg-700/sharp/chevron_line_up-fill.svg?react";
import TocIcon from "@material-symbols/svg-700/sharp/toc-fill.svg?react";

const HEADER_OFFSET = 120;
const PREV_HOTKEY = "Shift+ArrowUp";
const NEXT_HOTKEY = "Shift+ArrowDown";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

function TocProgressBar() {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth));
    ro.observe(el);
    setWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const height = 2;
  const clamped = Math.min(100, Math.max(0, progress));
  const fillX = (clamped / 100) * width;
  const y = height / 2;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          overflow="visible"
          className="absolute inset-0"
        >
          <line
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="var(--color-violet-6)"
            strokeWidth={height}
            strokeOpacity={0.2}
          />
          {clamped > 0 && (
            <>
              <line
                x1={0}
                y1={y}
                x2={fillX}
                y2={y}
                stroke={`url(#${id}-fill)`}
                strokeWidth={height}
              />
              <line
                x1={0}
                y1={y}
                x2={fillX}
                y2={y}
                stroke={`url(#${id}-beam)`}
                strokeWidth={height}
              />
            </>
          )}
          <defs>
            <linearGradient
              id={`${id}-fill`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={y}
              x2={fillX}
              y2={y}
            >
              <stop
                offset="0%"
                stopColor="var(--color-violet-8)"
                stopOpacity={0.5}
              />
              <stop offset="100%" stopColor="var(--color-violet-5)" />
            </linearGradient>

            <motion.linearGradient
              id={`${id}-beam`}
              gradientUnits="userSpaceOnUse"
              initial={{ x1: -40, x2: 0, y1: y, y2: y }}
              animate={{
                x1: [-40, width - 20],
                x2: [0, width + 20],
                y1: [y, y],
                y2: [y, y],
              }}
              transition={{
                duration: 3,
                ease: [0.16, 1, 0.3, 1],
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <stop offset="0%" stopColor="white" stopOpacity={0} />
              <stop offset="50%" stopColor="white" stopOpacity={0.9} />
              <stop offset="100%" stopColor="white" stopOpacity={0} />
            </motion.linearGradient>
          </defs>
        </svg>
      )}
    </div>
  );
}

function TocPanel({
  toc,
  activeId,
  collapse,
}: {
  toc: TocData;
  activeId: string | null;
  collapse: boolean;
}) {
  const activeEntry = useMemo(() => {
    if (!activeId) return null;
    for (const { section, headings } of toc) {
      if (section === activeId)
        return {
          text: section,
          href: section === "context" ? "#" : `#${section}`,
        };
      const h = headings.find((h) => h.id === activeId);
      if (h) return { text: h.text, href: `#${activeId}` };
    }
    return null;
  }, [activeId, toc]);
  const navRef = useRef<HTMLElement>(null);
  const { height: navHeight } = useSize(navRef);
  return (
    <motion.div
      animate={{ height: navHeight || undefined }}
      transition={{ duration: 0, ease: "easeIn" }}
      data-state={collapse ? "collapsed" : "expanded"}
      className="group/toc-panel overflow-hidden xl:bg-white xl:shadow-2xl xl:ring-1 xl:shadow-neutral-4/50 xl:ring-neutral-3"
    >
      <nav
        ref={navRef}
        className="flex flex-col gap-6 p-0 transition-[padding,gap] duration-100 ease-in-out xl:gap-3 xl:p-6 xl:group-data-[state=collapsed]/toc-panel:gap-1 xl:group-data-[state=collapsed]/toc-panel:p-2"
      >
        <p className="typography-text-2 font-semibold text-violet-7">
          <TocIcon className="inline size-4 fill-violet-7 transition-[width,height] duration-100 group-data-[state=collapsed]/toc-panel:size-3" />
          <span className="ml-2 transition-opacity duration-100 group-data-[state=collapsed]/toc-panel:opacity-0">
            on this page
          </span>
        </p>
        <AnimatePresence mode="popLayout" initial={false}>
          {collapse ? (
            <motion.a
              key="collapsed"
              href={activeEntry?.href ?? "#"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.1 } }}
              exit={{ opacity: 0 }}
              className="typography-text-3 text-neutral-11 transition-[color] hover:text-violet-7"
            >
              {activeEntry?.text}
            </motion.a>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.1 } }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5 xl:gap-2"
            >
              {toc.map(({ section, headings }) => (
                <div
                  key={section}
                  className="flex flex-col gap-3 border-t border-neutral-3 pt-4 xl:gap-1 xl:pt-2"
                >
                  <a
                    href={section === "context" ? "#" : `#${section}`}
                    className="typography-label-3 tracking-widest text-neutral-9 uppercase transition-[color] hover:text-violet-7 xl:typography-label-4"
                  >
                    {section}
                  </a>
                  {headings.length > 0 && (
                    <ul className="flex flex-col gap-0.5">
                      {headings.map(({ text, level, id }) => (
                        <li
                          className="typography-text-2 xl:typography-text-3 2xl:typography-text-2"
                          key={text}
                          style={{
                            paddingLeft: level === 3 ? "0.75rem" : undefined,
                          }}
                        >
                          <a
                            href={`#${id}`}
                            className="typography-text-2 text-neutral-11 transition-[color] hover:text-violet-7 xl:typography-text-3 2xl:typography-text-2"
                          >
                            {text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.div>
  );
}

function TocControls({
  toc,
  activeId,
  collapse,
}: {
  toc: TocData;
  activeId: string | null;
  collapse: boolean;
}) {
  const navIds = useMemo(
    () => toc.flatMap(({ headings }) => headings.map((h) => h.id)),
    [toc],
  );

  // When activeId is a heading: direct lookup.
  // When activeId is a section: return (first heading index - 1) so "next"
  // jumps to the first heading of that section.
  const navIndex = useMemo(() => {
    if (!activeId) return -1;
    const direct = navIds.indexOf(activeId);
    if (direct !== -1) return direct;
    for (const { section, headings } of toc) {
      if (section !== activeId) continue;
      const firstId = headings[0]?.id;
      if (!firstId) return -1;
      return navIds.indexOf(firstId) - 1;
    }
    return -1;
  }, [activeId, navIds, toc]);

  const gotoPrev = () => {
    if (navIndex >= 0) {
      const el = document.getElementById(navIds[navIndex]);
      const atStart =
        !el || el.getBoundingClientRect().top >= HEADER_OFFSET - 5;
      if (!atStart) {
        scrollToId(navIds[navIndex]);
        return;
      }
    }
    if (navIndex > 0) scrollToId(navIds[navIndex - 1]);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const gotoNext = () => {
    if (navIndex < navIds.length - 1) scrollToId(navIds[navIndex + 1]);
  };

  useHotkey(PREV_HOTKEY, gotoPrev);
  useHotkey(NEXT_HOTKEY, gotoNext);

  return (
    <div
      data-state={collapse ? "collapsed" : "expanded"}
      className="fixed bottom-12 left-6 z-100 flex w-full gap-2 transition-opacity duration-200 data-[state=collapsed]:opacity-0 sm:bottom-6 xl:static"
    >
      <Button
        className="xl:grow"
        variant="secondary"
        size="small"
        onClick={gotoPrev}
        aria-label="Go To Previous Heading"
      >
        <ButtonLeadingIcon>
          <ChevronLineUpIcon />
        </ButtonLeadingIcon>
        <ButtonLabel className="hidden! xl:flex!">Prev</ButtonLabel>
        <ButtonHotkey
          keys={PREV_HOTKEY}
          className="max-xl:top-0 max-xl:-right-16 max-xl:bottom-auto"
        />
      </Button>
      <Button
        className="mt-14 xl:grow"
        variant="secondary"
        size="small"
        onClick={gotoNext}
        disabled={navIndex >= navIds.length - 1}
        aria-label="Go To Next Heading"
      >
        <ButtonLabel className="hidden xl:flex">Next</ButtonLabel>
        <ButtonTrailingIcon>
          <ChevronLineUpIcon className="rotate-180" />
        </ButtonTrailingIcon>
        <ButtonHotkey
          keys={NEXT_HOTKEY}
          className="max-xl:top-0 max-xl:-right-16 max-xl:bottom-auto"
        />
      </Button>
    </div>
  );
}

function Toc({ toc, className }: { toc: TocData; className?: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const allIds = useMemo(
    () =>
      toc.flatMap(({ section, headings }) => [
        section,
        ...headings.map((h) => h.id),
      ]),
    [toc],
  );

  const ref = useRef<HTMLDivElement>(null);
  const collapseEnabled = useBreakpointValue({ base: false, xl: true });
  const shouldCollapse = useShouldCollapse(ref, { margin: 400 });
  const [hovered, setHovered] = useState(false);
  const collapse = collapseEnabled && shouldCollapse && !hovered;

  useEffect(() => {
    const onScroll = () => {
      let active: string | null = null;
      for (const id of allIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= HEADER_OFFSET) active = id;
      }
      if (active) setActiveId(active);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [allIds]);

  return (
    <motion.div
      ref={ref}
      className={cn("not-prose flex flex-col gap-5 xl:gap-2", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <TocPanel toc={toc} activeId={activeId} collapse={collapse} />
      <TocProgressBar />
      <TocControls toc={toc} activeId={activeId} collapse={collapse} />
    </motion.div>
  );
}

export { Toc };
