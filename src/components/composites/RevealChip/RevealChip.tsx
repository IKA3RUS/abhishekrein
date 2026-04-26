import * as React from "react";

import { type VariantProps, cva } from "class-variance-authority";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/Popover";

import { cn } from "@/lib/cn";

import AddIcon from "@material-symbols/svg-700/sharp/add-fill.svg?react";
import RemoveIcon from "@material-symbols/svg-700/sharp/remove-fill.svg?react";

const revealChipTriggerVariants = cva(
  "group/reveal-chip-trigger relative inline-flex w-fit cursor-pointer items-center text-neutral-11 uppercase",
  {
    variants: {
      size: {
        default:
          "h-7 gap-2 px-2 typography-text-3 [&_svg:not([class*='size-'])]:size-4",
        small:
          "h-6 gap-1.5 px-2 typography-text-4 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type Size = VariantProps<typeof revealChipTriggerVariants>["size"];

const RevealChipContext = React.createContext<{ size?: Size }>({});

function RevealChip({
  size,
  ...props
}: React.ComponentProps<typeof Popover> & { size?: Size }) {
  return (
    <RevealChipContext.Provider value={{ size }}>
      <Popover {...props} />
    </RevealChipContext.Provider>
  );
}

function RevealChipTrigger({
  className,
  children,
  size: sizeProp,
  ...props
}: React.ComponentProps<typeof PopoverTrigger> & { size?: Size }) {
  const { size: contextSize } = React.useContext(RevealChipContext);
  const size = sizeProp ?? contextSize;

  const svgRef = React.useRef<SVGSVGElement>(null);
  const [dims, setDims] = React.useState({ w: 0, h: 0 });

  React.useLayoutEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: parent.offsetWidth, h: parent.offsetHeight });
    });
    ro.observe(parent);
    setDims({ w: parent.offsetWidth, h: parent.offsetHeight });
    return () => ro.disconnect();
  }, []);

  return (
    <PopoverTrigger
      data-slot="reveal-chip-trigger"
      data-size={size ?? "default"}
      openOnHover
      delay={0}
      className={cn(revealChipTriggerVariants({ size }), className)}
      {...props}
    >
      <svg
        ref={svgRef}
        aria-hidden
        width={dims.w}
        height={dims.h}
        className="pointer-events-none absolute inset-0 size-full"
      >
        <rect
          x="1"
          y="1"
          width={dims.w - 2}
          height={dims.h - 2}
          fill="none"
          stroke="var(--color-violet-7)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="group-data-popup-open/reveal-chip-trigger:animate-march-border"
        />
      </svg>
      {children}
      <span className="relative size-4 shrink-0 group-data-[size=small]/reveal-chip-trigger:size-3">
        <AddIcon
          aria-hidden
          className="absolute inset-0 fill-neutral-11 transition-all duration-200 group-data-popup-open/reveal-chip-trigger:rotate-90 group-data-popup-open/reveal-chip-trigger:opacity-0"
        />
        <RemoveIcon
          aria-hidden
          className="absolute inset-0 -rotate-90 fill-neutral-11 opacity-0 transition-all duration-200 group-data-popup-open/reveal-chip-trigger:rotate-0 group-data-popup-open/reveal-chip-trigger:opacity-100"
        />
      </span>
    </PopoverTrigger>
  );
}

function RevealChipIcon({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="reveal-chip-icon"
      className={cn(
        "inline-flex shrink-0 items-center [&_svg:not([class*='size-'])]:fill-violet-8",
        className,
      )}
      {...props}
    />
  );
}

function RevealChipLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="reveal-chip-label"
      className={cn(
        "group-data-popup-open/reveal-chip-trigger:animate-vibrate",
        className,
      )}
      {...props}
    />
  );
}

function RevealChipSummary({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <>
      <span aria-hidden className="text-neutral-4">
        •
      </span>
      <span
        data-slot="reveal-chip-summary"
        className={cn("flex items-center gap-1", className)}
        {...props}
      >
        {children}
      </span>
    </>
  );
}

function RevealChipContent({
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return <PopoverContent {...props} />;
}

export {
  RevealChip,
  RevealChipContent,
  RevealChipIcon,
  RevealChipLabel,
  RevealChipSummary,
  RevealChipTrigger,
  revealChipTriggerVariants,
};
