import {
  type RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Button,
  ButtonHotkey,
  ButtonLabel,
  ButtonLeadingIcon,
  ButtonTrailingIcon,
} from "@/components/primitives/Button";

import { useBreakpointValue } from "@/hooks/useBreakpointValue";
import { useShouldCollapse } from "@/hooks/useShouldCollapse";
import { cn } from "@/lib/cn";
import { type Toc as TocData } from "@/lib/remark/remark-extract-toc";

import ChevronLineUpIcon from "@material-symbols/svg-700/sharp/chevron_line_up-fill.svg?react";
import TocIcon from "@material-symbols/svg-700/sharp/toc-fill.svg?react";

const PREV_HOTKEY = "Shift+ArrowUp";
const NEXT_HOTKEY = "Shift+ArrowDown";

// The first section in work content uses this id and represents the page intro,
// so navigating to it scrolls to the very top instead of to the heading element.
const FIRST_SECTION_ID = "context";

// Fraction of viewport height from the top at which a heading becomes "active".
const HEADING_ACTIVATION_TOP_PROXIMITY = 0.15;

// Pre-computed rootMargin for IntersectionObserver: shrinks the observation
// area to the top HEADING_ACTIVATION_TOP_PROXIMITY band of the viewport.
const ACTIVE_HEADING_ROOT_MARGIN = `0px 0px -${
  (1 - HEADING_ACTIVATION_TOP_PROXIMITY) * 100
}% 0px`;

// Land the clicked heading 1px above the activation line so smooth-scroll
// fractional landing positions can never push it past the threshold and out
// of the active set.
const ACTIVATION_LINE_BUFFER_PX = 1;

// Hard cap on how long IO-driven activeId updates stay suppressed after a
// click. scrollend releases earlier where supported; this is the fallback.
const NAVIGATE_SUPPRESSION_FALLBACK_MS = 1500;

// "At start" tolerance for the prev hotkey: if the active heading is within
// this many pixels of where it would land after a click, prev goes to the
// previous heading instead of re-anchoring to the current one.
const PREV_HOTKEY_AT_START_TOLERANCE_PX = 5;

// Buffer in pixels used when checking if the active TOC item is comfortably in
// view inside the nav scroller before deciding whether to recenter.
const NAV_VISIBLE_BUFFER = 16;

const BREAKPOINT_CONFIG = { base: false, xl: true } as const;
const COLLAPSE_OPTIONS = { collapseMargin: 400 };

type TocEntry = { text: string; href: string };

type TocContextValue = {
  toc: TocData;
  activeId: string | null;
  collapse: boolean;
  navRef: RefObject<HTMLElement | null>;
  allIds: string[];
  navIds: string[];
  entryById: Map<string, TocEntry>;
  navigateToHeading: (id: string) => void;
};

const TocContext = createContext<TocContextValue | null>(null);

function useTocContext() {
  const ctx = useContext(TocContext);
  if (!ctx) throw new Error("Toc subcomponents must be used within <Toc>");
  return ctx;
}

function useActiveHeading(allIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // aboveLine holds ids whose top has crossed the activation line. The IO
  // callback mutates this Set in place; navigate() and the suppression
  // release handler read from it. Held in a ref so it stays accessible
  // outside the useEffect closure.
  const aboveLineRef = useRef<Set<string>>(new Set());
  const allIdsRef = useRef(allIds);
  allIdsRef.current = allIds;

  // While true, IO callbacks update aboveLine but skip the setActiveId call.
  // Released by scrollend or the fallback timeout.
  const suppressedRef = useRef(false);

  // The currently registered scrollend listener and its fallback timeout, if
  // any. Held in refs so a follow-up navigate() can cancel a prior pending
  // release before installing fresh ones.
  const pendingScrollEndRef = useRef<(() => void) | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recomputeActiveFromAboveLine = useCallback(() => {
    const ids = allIdsRef.current;
    const aboveLine = aboveLineRef.current;
    for (let i = ids.length - 1; i >= 0; i--) {
      if (aboveLine.has(ids[i])) {
        setActiveId(ids[i]);
        return;
      }
    }
  }, []);

  // IO compares each tick's intersection ratio against the previous tick's. A
  // heading that travels all the way through the band within a single frame
  // (start ratio 0, end ratio 0, transient positive in between) reads as
  // "unchanged" and never fires a callback. Reading positions from the DOM
  // gives us a guaranteed-fresh snapshot, used on suppression release.
  const refreshAboveLineFromDom = useCallback(() => {
    const threshold = window.innerHeight * HEADING_ACTIVATION_TOP_PROXIMITY;
    const ids = allIdsRef.current;
    const aboveLine = aboveLineRef.current;
    aboveLine.clear();
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= threshold) {
        aboveLine.add(id);
      }
    }
  }, []);

  const cancelPendingRelease = useCallback(() => {
    if (pendingScrollEndRef.current) {
      window.removeEventListener("scrollend", pendingScrollEndRef.current);
      pendingScrollEndRef.current = null;
    }
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  const navigate = useCallback(
    (id: string) => {
      cancelPendingRelease();

      setActiveId(id);
      suppressedRef.current = true;

      const release = () => {
        cancelPendingRelease();
        suppressedRef.current = false;
        refreshAboveLineFromDom();
        recomputeActiveFromAboveLine();
      };

      pendingScrollEndRef.current = release;
      // scrollend is supported in modern Chrome/Firefox/Safari; older browsers
      // silently no-op the listener and rely on the timeout below.
      window.addEventListener("scrollend", release, { once: true });
      pendingTimeoutRef.current = setTimeout(
        release,
        NAVIGATE_SUPPRESSION_FALLBACK_MS,
      );

      if (id === FIRST_SECTION_ID) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      const offset = window.innerHeight * HEADING_ACTIVATION_TOP_PROXIMITY;
      const target =
        el.getBoundingClientRect().top +
        window.scrollY -
        offset +
        ACTIVATION_LINE_BUFFER_PX;
      window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    },
    [
      cancelPendingRelease,
      recomputeActiveFromAboveLine,
      refreshAboveLineFromDom,
    ],
  );

  useEffect(() => {
    if (allIds.length === 0) return;

    aboveLineRef.current = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        const threshold = window.innerHeight * HEADING_ACTIVATION_TOP_PROXIMITY;
        const aboveLine = aboveLineRef.current;
        for (const entry of entries) {
          if (entry.boundingClientRect.top <= threshold) {
            aboveLine.add(entry.target.id);
          } else {
            aboveLine.delete(entry.target.id);
          }
        }
        if (suppressedRef.current) return;
        recomputeActiveFromAboveLine();
      },
      { rootMargin: ACTIVE_HEADING_ROOT_MARGIN },
    );

    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [allIds, recomputeActiveFromAboveLine]);

  useEffect(() => {
    return cancelPendingRelease;
  }, [cancelPendingRelease]);

  return { activeId, navigate };
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}

function TocLink({
  id,
  active,
  className,
  children,
}: {
  id: string;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { navigateToHeading } = useTocContext();
  return (
    <a
      href={id === FIRST_SECTION_ID ? "#" : `#${id}`}
      data-active={active}
      onClick={(e) => {
        e.preventDefault();
        navigateToHeading(id);
      }}
      className={className}
    >
      {children}
    </a>
  );
}

function TocProgressBar() {
  const progress = useScrollProgress();
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="relative h-0.5 w-full bg-violet-6/25">
      <div
        className="absolute inset-y-0 left-0 overflow-hidden bg-linear-to-r from-violet-6 to-violet-3"
        style={{ width: `${clamped}%` }}
      >
        {clamped > 0 && (
          <div className="animate-toc-beam absolute inset-y-0 -left-10 w-10 bg-linear-to-r from-transparent via-white/90 to-transparent" />
        )}
      </div>
    </div>
  );
}

function TocPanel() {
  const { toc, activeId, collapse, navRef, entryById } = useTocContext();
  const activeEntry = activeId ? (entryById.get(activeId) ?? null) : null;

  return (
    <div
      data-state={collapse ? "collapsed" : "expanded"}
      className="group/toc-panel xl:bg-white xl:shadow-2xl xl:ring-1 xl:shadow-neutral-4/50 xl:ring-neutral-3"
    >
      <div className="flex flex-col gap-6 xl:gap-1">
        <div className="xl:p-6 xl:pb-6 xl:transition-[padding] xl:duration-100 xl:ease-in-out xl:group-data-[state=collapsed]/toc-panel:p-2 xl:group-data-[state=collapsed]/toc-panel:pt-1 xl:group-data-[state=collapsed]/toc-panel:pb-0">
          <p className="typography-text-2 font-semibold text-violet-7">
            <TocIcon className="inline size-4 fill-violet-7 xl:transition-[width,height] xl:duration-100 xl:group-data-[state=collapsed]/toc-panel:size-3" />
            {!collapse && (
              <span className="ml-2 animate-in duration-300 fade-in">
                on this page
              </span>
            )}
          </p>
        </div>
        {collapse ? (
          <div className="xl:p-2 xl:pt-0 xl:transition-[padding] xl:duration-100 xl:ease-in-out">
            {activeEntry && activeId && (
              <TocLink
                id={activeId}
                active
                className="block typography-text-3 text-neutral-11 transition-[color] hover:text-violet-7"
              >
                {activeEntry.text}
              </TocLink>
            )}
          </div>
        ) : (
          <nav
            ref={navRef}
            className="flex flex-col gap-5 border-t border-neutral-3 xl:max-h-[30dvh] xl:gap-2 xl:overflow-y-auto xl:px-6 xl:pb-6"
          >
            {toc.map(({ section, headings }) => (
              <div
                key={section}
                className="flex flex-col gap-3 border-neutral-3 pt-4 not-first:border-t xl:gap-1 xl:pt-2"
              >
                <TocLink
                  id={section}
                  active={activeId === section}
                  className="typography-label-3 tracking-widest text-neutral-9 uppercase transition-[color] hover:text-violet-7 data-[active=true]:text-violet-6 xl:typography-label-4"
                >
                  {section}
                </TocLink>
                {headings.length > 0 && (
                  <ul className="flex flex-col gap-2 2xl:gap-4">
                    {headings.map(({ text, level, id }) => (
                      <li
                        key={id}
                        className={cn(
                          "typography-text-2 xl:typography-text-3 2xl:typography-text-2",
                          level === 3 && "pl-3",
                        )}
                      >
                        <TocLink
                          id={id}
                          active={activeId === id}
                          className="typography-text-2 text-neutral-11 transition-[color] hover:text-violet-7 data-[active=true]:text-violet-6 xl:typography-text-3 2xl:typography-text-2"
                        >
                          {text}
                        </TocLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function TocControls() {
  const { activeId, collapse, navIds, toc, navigateToHeading } =
    useTocContext();

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

  const navIndexRef = useRef(navIndex);
  navIndexRef.current = navIndex;
  const navIdsRef = useRef(navIds);
  navIdsRef.current = navIds;

  const handlersRef = useRef({
    prev: () => {
      const i = navIndexRef.current;
      const ids = navIdsRef.current;
      if (i >= 0) {
        const el = document.getElementById(ids[i]);
        if (el) {
          const offset = window.innerHeight * HEADING_ACTIVATION_TOP_PROXIMITY;
          // If the active heading is meaningfully above the activation line,
          // we have scrolled into its section: rewind to the heading itself.
          // Otherwise step to the previous one.
          const isPast =
            el.getBoundingClientRect().top <
            offset - PREV_HOTKEY_AT_START_TOLERANCE_PX;
          if (isPast) {
            navigateToHeading(ids[i]);
            return;
          }
        }
      }
      if (i > 0) navigateToHeading(ids[i - 1]);
      else navigateToHeading(FIRST_SECTION_ID);
    },
    next: () => {
      const i = navIndexRef.current;
      const ids = navIdsRef.current;
      if (i < ids.length - 1) navigateToHeading(ids[i + 1]);
    },
  });

  return (
    <div
      data-state={collapse ? "collapsed" : "expanded"}
      className="fixed bottom-12 left-9 z-100 flex w-full gap-2 transition-opacity duration-200 data-[state=collapsed]:opacity-0 sm:bottom-6 xl:static"
    >
      <Button
        className="xl:grow"
        variant="secondary"
        size="small"
        onClick={() => handlersRef.current.prev()}
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
        onClick={() => handlersRef.current.next()}
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
  const ref = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Derive every list/index/lookup we need from toc.
  const { allIds, navIds, entryById } = useMemo(() => {
    const allIds: string[] = [];
    const navIds: string[] = [];
    const entryById = new Map<string, TocEntry>();
    for (const { section, headings } of toc) {
      allIds.push(section);
      entryById.set(section, {
        text: section,
        href: section === FIRST_SECTION_ID ? "#" : `#${section}`,
      });
      if (headings.length === 0) {
        navIds.push(section);
      }
      for (const h of headings) {
        allIds.push(h.id);
        navIds.push(h.id);
        entryById.set(h.id, { text: h.text, href: `#${h.id}` });
      }
    }
    return { allIds, navIds, entryById };
  }, [toc]);

  const { activeId, navigate: navigateToHeading } = useActiveHeading(allIds);

  const collapseEnabled = useBreakpointValue(BREAKPOINT_CONFIG);
  const shouldCollapse = useShouldCollapse(ref, COLLAPSE_OPTIONS);
  const isCollapsible = collapseEnabled && shouldCollapse;
  const [hovered, setHovered] = useState(false);
  const collapse = isCollapsible && !hovered;

  // Attach hover listeners only when the panel is actually collapsible. This
  // avoids firing setHovered (and the resulting render) when hover would not
  // change the collapsed state anyway.
  useEffect(() => {
    if (!isCollapsible) {
      setHovered(false);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);
    node.addEventListener("mouseenter", onEnter);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mouseenter", onEnter);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, [isCollapsible]);

  // Keep the active item visually in view inside the nav scroller. Skip
  // entirely when the item is already comfortably visible. Because activeId
  // is locked during click-driven scrolls, this effect runs once per click
  // instead of once per intermediate heading.
  useEffect(() => {
    if (collapse) return;
    const nav = navRef.current;
    if (!nav) return;
    const activeEl = nav.querySelector<HTMLElement>('[data-active="true"]');
    if (!activeEl) return;

    const navRect = nav.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();
    const inView =
      elRect.top >= navRect.top + NAV_VISIBLE_BUFFER &&
      elRect.bottom <= navRect.bottom - NAV_VISIBLE_BUFFER;
    if (inView) return;

    const elementTop = elRect.top - navRect.top + nav.scrollTop;
    const target = elementTop - (nav.clientHeight - activeEl.offsetHeight) / 2;
    const max = Math.max(0, nav.scrollHeight - nav.clientHeight);
    nav.scrollTo({
      top: Math.max(0, Math.min(max, target)),
      behavior: "smooth",
    });
  }, [activeId, collapse]);

  const ctx = useMemo<TocContextValue>(
    () => ({
      toc,
      activeId,
      collapse,
      navRef,
      allIds,
      navIds,
      entryById,
      navigateToHeading,
    }),
    [toc, activeId, collapse, allIds, navIds, entryById, navigateToHeading],
  );

  return (
    <TocContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cn("not-prose flex flex-col gap-5 xl:gap-2", className)}
      >
        <TocPanel />
        <TocProgressBar />
        <TocControls />
      </div>
    </TocContext.Provider>
  );
}

export { Toc };
