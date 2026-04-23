import { useEffect, useId, useState } from "react";
import type { RefObject } from "react";

import { motion } from "motion/react";

import { cn } from "@/lib/cn";

interface AnimatedBeamPathProps {
  d: string;
  id: string;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
}

function AnimatedBeamPath({
  d,
  id,
  pathColor = "white",
  pathWidth = 2,
  pathOpacity = 0.25,
}: AnimatedBeamPathProps) {
  return (
    <>
      <path
        d={d}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="square"
      />
      <path
        d={d}
        stroke={`url(#${id})`}
        strokeWidth={pathWidth}
        strokeOpacity={1}
        strokeLinecap="square"
      />
    </>
  );
}

interface AnimatedBeamGradientProps {
  id: string;
  gradientStartColor?: string;
  gradientStopColor?: string;
  reverse?: boolean;
  delay?: number;
  duration?: number;
}

function AnimatedBeamGradient({
  id,
  gradientStartColor = "white",
  gradientStopColor = "white",
  reverse = false,
  delay = 0,
  duration = 5,
}: AnimatedBeamGradientProps) {
  const coords = reverse
    ? { x1: ["90%", "-10%"], x2: ["100%", "0%"] }
    : { x1: ["10%", "110%"], x2: ["0%", "100%"] };

  return (
    <motion.linearGradient
      id={id}
      gradientUnits="userSpaceOnUse"
      initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
      animate={{
        x1: coords.x1,
        x2: coords.x2,
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }}
      transition={{
        delay,
        duration,
        ease: [0.16, 1, 0.3, 1],
        repeat: Infinity,
      }}
    >
      <stop stopColor={gradientStartColor} stopOpacity="0" />
      <stop stopColor={gradientStartColor} />
      <stop offset="32.5%" stopColor={gradientStopColor} />
      <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
    </motion.linearGradient>
  );
}

interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;

  variant?: "positions" | "horizontal";

  fromRef?: RefObject<HTMLElement | null>;
  toRef?: RefObject<HTMLElement | null>;

  y?: number;

  curvature?: number;
  reverse?: boolean;

  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;

  gradientStartColor?: string;
  gradientStopColor?: string;

  delay?: number;
  duration?: number;

  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

function AnimatedBeam({
  className,
  containerRef,
  variant = "horizontal",
  fromRef,
  toRef,
  y,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "white",
  pathWidth = 2,
  pathOpacity = 0.25,
  gradientStartColor = "white",
  gradientStopColor = "white",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const svgWidth = containerRect.width;
      const svgHeight = containerRect.height;
      setSvgDimensions({ width: svgWidth, height: svgHeight });

      if (variant === "horizontal") {
        const startX = 0 + startXOffset;
        const endX = svgWidth + endXOffset;
        const centerY = (y ?? svgHeight / 2) + startYOffset;
        const controlY = centerY - curvature;
        setPathD(
          `M ${startX},${centerY} Q ${(startX + endX) / 2},${controlY} ${endX},${centerY}`,
        );
        return;
      }

      if (variant === "positions" && fromRef?.current && toRef?.current) {
        const rectA = fromRef.current.getBoundingClientRect();
        const rectB = toRef.current.getBoundingClientRect();

        const startX =
          rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
        const startY =
          rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
        const endX =
          rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
        const endY =
          rectB.top - containerRect.top + rectB.height / 2 + endYOffset;
        const controlY = startY - curvature;
        setPathD(
          `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`,
        );
      }
    };

    const resizeObserver = new ResizeObserver(updatePath);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    updatePath();
    return () => resizeObserver.disconnect();
  }, [
    containerRef,
    fromRef,
    toRef,
    variant,
    y,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute top-0 left-0 transform-gpu stroke-2",
        className,
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      overflow="visible"
    >
      <AnimatedBeamPath
        d={pathD}
        id={id}
        pathColor={pathColor}
        pathWidth={pathWidth}
        pathOpacity={pathOpacity}
      />
      <defs>
        <AnimatedBeamGradient
          id={id}
          gradientStartColor={gradientStartColor}
          gradientStopColor={gradientStopColor}
          reverse={reverse}
          delay={delay}
          duration={duration}
        />
      </defs>
    </svg>
  );
}

export { AnimatedBeam, AnimatedBeamPath, AnimatedBeamGradient };
export type {
  AnimatedBeamProps,
  AnimatedBeamPathProps,
  AnimatedBeamGradientProps,
};
