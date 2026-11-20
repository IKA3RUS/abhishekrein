import { createContext, useContext, useEffect, useRef, useState } from "react";

import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/cn";

import Logo from "@/assets/common/logos/ika3rus-logo.svg?react";

type HeaderVariant = "collapsed" | "expanded";

// Luminosity of the section behind the header, read from the nearest
// [data-section-luminosity] element under it
type SectionLuminosity = "dark" | "light";

interface HeaderContextValue {
  variant: HeaderVariant;
  luminosity?: SectionLuminosity;
}

const HeaderContext = createContext<HeaderContextValue>({
  variant: "expanded",
});

function useHeader() {
  return useContext(HeaderContext);
}

interface HeaderProps {
  children: React.ReactNode;
  initial?: HeaderVariant;
  expandMargin?: number;
  hideOnFooter?: boolean;
  hideOnFooterMargin?: number;
  className?: string;
}

function Header({
  children,
  initial,
  expandMargin = 300,
  hideOnFooter = true,
  hideOnFooterMargin = 150,
  className,
}: HeaderProps) {
  const [variant, setVariant] = useState<HeaderVariant>(initial ?? "expanded");
  const [footerInView, setFooterInView] = useState(false);
  const [luminosity, setLuminosity] = useState<SectionLuminosity>();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (initial !== "collapsed") return;

    function onScroll() {
      setVariant(window.scrollY > expandMargin ? "expanded" : "collapsed");
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [initial, expandMargin]);

  useEffect(() => {
    if (!hideOnFooter) return;

    function onScroll() {
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      setFooterInView(
        scrollY + innerHeight >= scrollHeight - hideOnFooterMargin,
      );
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnFooter, hideOnFooterMargin]);

  // Takes the luminosity of the last marked element crossing the header's centre
  // line. Later elements in the document paint over earlier ones they overlap.
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const header = headerRef.current;
      if (!header) return;
      const { top, height } = header.getBoundingClientRect();
      const y = top + height / 2;
      let next: SectionLuminosity | undefined;
      for (const el of document.querySelectorAll<HTMLElement>(
        "[data-section-luminosity]",
      )) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= y && rect.bottom > y)
          next = el.dataset.sectionLuminosity as SectionLuminosity;
      }
      setLuminosity(next);
    }
    function schedule() {
      frame ||= requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Sections can change luminosity without a scroll
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributeFilter: ["data-section-luminosity"],
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  return (
    <HeaderContext.Provider value={{ variant, luminosity }}>
      <header
        ref={headerRef}
        data-variant={variant}
        className={cn(
          "@container pointer-events-none fixed top-0 right-0 left-0 z-50 mx-auto flex h-32 max-w-480 items-center px-9 transition-opacity duration-200 sm:px-20",
          footerInView && "opacity-0",
          className,
        )}
      >
        {children}
      </header>
    </HeaderContext.Provider>
  );
}

function HeaderLogo({ className }: { className?: string }) {
  const { variant, luminosity } = useHeader();

  return (
    <Link to="/" aria-label="abhishek rein, home">
      <Logo
        data-preloader-target
        className={cn(
          "pointer-events-auto fill-white transition-[translate,fill] duration-150 ease-in-out",
          luminosity === "light" && "fill-violet-7",
          variant === "collapsed" && "translate-x-[calc(50cqw-50%)]",
          className,
        )}
      />
    </Link>
  );
}

function HeaderNavigation({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { variant } = useHeader();

  return (
    <div
      className={cn(
        "pointer-events-auto ml-4 hidden gap-4 transition-all duration-100 ease-in sm:flex",
        variant === "expanded"
          ? "opacity-100"
          : "pointer-events-none opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function HeaderAction({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { variant } = useHeader();

  return (
    <div
      className={cn(
        "pointer-events-auto ml-auto hidden gap-4 transition-all duration-100 ease-out sm:flex",
        variant === "expanded"
          ? "opacity-100"
          : "pointer-events-none opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { Header, HeaderAction, HeaderLogo, HeaderNavigation };
