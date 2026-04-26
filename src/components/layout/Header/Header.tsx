import { createContext, useContext, useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/cn";

import Logo from "@/assets/common/logos/ika3rus-logo.svg?react";

type HeaderVariant = "collapsed" | "expanded";

interface HeaderContextValue {
  variant: HeaderVariant;
}

const HeaderContext = createContext<HeaderContextValue>({ variant: "expanded" });

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

  return (
    <HeaderContext.Provider value={{ variant }}>
      <header
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
  const { variant } = useHeader();

  return (
    <Link to="/">
      <Logo
        className={cn(
          "pointer-events-auto fill-white transition-transform duration-150 ease-in-out",
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
        variant === "expanded" ? "opacity-100" : "pointer-events-none opacity-0",
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
        variant === "expanded" ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { Header, HeaderAction, HeaderLogo, HeaderNavigation };
