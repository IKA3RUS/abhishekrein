import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  AnimatedBeamGradient,
  AnimatedBeamPath,
  type AnimatedBeamProps,
} from "@/components/AnimatedBeam";

export type TrackType = "cap" | "ascender" | "x" | "baseline";

type TrackOverride = Partial<AnimatedBeamProps> & { enabled?: boolean };

interface Track {
  type: TrackType;
  y: number;
  label: string;
}

interface Line {
  tracks: Track[];
}

const HAS_CAP = /[A-Z]/;
const HAS_ASCENDER = /[bdfhjkl]/;

function measureContainer(
  contentEl: HTMLElement,
  containerEl: HTMLElement,
): Line[] {
  const groups: Array<{
    chars: string;
    sampleTop: number;
    parentEl: HTMLElement;
  }> = [];

  function walkNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      const parentEl = node.parentElement;
      if (!parentEl || !text.trim()) return;

      for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") continue;
        const r = document.createRange();
        r.setStart(node, i);
        r.setEnd(node, i + 1);
        const rect = r.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;

        let g = groups.find((g) => Math.abs(g.sampleTop - rect.top) < 3);
        if (!g) {
          g = { sampleTop: rect.top, chars: "", parentEl };
          groups.push(g);
        }
        g.chars += text[i];
      }
    } else {
      node.childNodes.forEach(walkNode);
    }
  }

  walkNode(contentEl);
  groups.sort((a, b) => a.sampleTop - b.sampleTop);

  const containerTop = containerEl.getBoundingClientRect().top;
  const parentLineSeen = new Map<HTMLElement, number>();

  return groups.map(({ chars, parentEl }) => {
    const cs = getComputedStyle(parentEl);
    const fontSize = parseFloat(cs.fontSize);
    const lh = parseFloat(cs.lineHeight);

    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
    const mH = ctx.measureText("H");
    const mAsc = ctx.measureText("h");
    const mx = ctx.measureText("x");

    const fbAsc = mH.fontBoundingBoxAscent ?? mH.actualBoundingBoxAscent * 1.18;
    const fbDesc =
      mH.fontBoundingBoxDescent ?? mH.actualBoundingBoxAscent * 0.22;
    const halfLead = Math.max(0, (lh - fbAsc - fbDesc) / 2);

    const lineIdx = parentLineSeen.get(parentEl) ?? 0;
    parentLineSeen.set(parentEl, lineIdx + 1);

    const parentTop = parentEl.getBoundingClientRect().top - containerTop;
    const baseline = parentTop + lineIdx * lh + halfLead + fbAsc;

    const allowed = parentEl.dataset.animatedTypographyBeams;
    const allowedSet = allowed
      ? new Set(allowed.split(",").map((s) => s.trim()))
      : null;

    const tracks: Track[] = [];

    if (HAS_CAP.test(chars) && (!allowedSet || allowedSet.has("cap"))) {
      tracks.push({
        type: "cap",
        y: baseline - mH.actualBoundingBoxAscent,
        label: `CAP HEIGHT ${Math.round(mH.actualBoundingBoxAscent)}KM`,
      });
    }
    if (
      HAS_ASCENDER.test(chars) &&
      (!allowedSet || allowedSet.has("ascender"))
    ) {
      tracks.push({
        type: "ascender",
        y: baseline - mAsc.actualBoundingBoxAscent,
        label: `ASC HEIGHT ${Math.round(mAsc.actualBoundingBoxAscent)}KM`,
      });
    }
    if (!allowedSet || allowedSet.has("x")) {
      tracks.push({
        type: "x",
        y: baseline - mx.actualBoundingBoxAscent,
        label: `x-HEIGHT ${Math.round(mx.actualBoundingBoxAscent)}KM`,
      });
    }
    if (!allowedSet || allowedSet.has("baseline")) {
      tracks.push({ type: "baseline", y: baseline, label: "BASELINE" });
    }

    return { tracks };
  });
}

export interface AnimatedTypographyBeamsProps extends Pick<
  AnimatedBeamProps,
  | "curvature"
  | "reverse"
  | "pathWidth"
  | "pathOpacity"
  | "delay"
  | "duration"
  | "startXOffset"
  | "endXOffset"
> {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  tracks?: Partial<Record<TrackType, TrackOverride>>;
}

function AnimatedTypographyBeams({
  children,
  className,
  style,
  curvature = 0,
  reverse = false,
  pathWidth = 2,
  pathOpacity = 0.25,
  delay = 0,
  duration,
  startXOffset = 0,
  endXOffset = 0,
  tracks: trackOverrides,
}: AnimatedTypographyBeamsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const prefixId = useId();

  const [lines, setLines] = useState<Line[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const durationsRef = useRef(new Map<string, number>());
  const getDuration = (key: string) => {
    if (!durationsRef.current.has(key)) {
      durationsRef.current.set(key, duration ?? Math.random() * 3 + 4);
    }
    return durationsRef.current.get(key)!;
  };

  const run = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const rect = container.getBoundingClientRect();
    setSvgSize({ width: rect.width, height: rect.height });
    setLines(measureContainer(content, container));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(run);
    });
    ro.observe(el);
    run();
    return () => {
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [run]);

  const allBeams = lines.flatMap((line, li) =>
    line.tracks
      .filter((track) => trackOverrides?.[track.type]?.enabled !== false)
      .map((track) => ({
        ...track,
        key: `${li}-${track.type}`,
        id: `${prefixId}-${li}-${track.type}`,
        trackProps: trackOverrides?.[track.type] ?? {},
      })),
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style, position: "relative" }}
    >
      <div ref={contentRef} style={{ display: "contents" }}>
        {children}
      </div>

      {/* Labels */}
      {allBeams.map((beam) => (
        <span
          key={beam.key}
          className="pointer-events-none absolute right-0 typography-label-4 text-[7px] font-semibold whitespace-nowrap text-white"
          style={{
            top: beam.y - 16,
            color: beam.trackProps.pathColor,
          }}
        >
          {beam.label}
        </span>
      ))}

      <svg
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        width={svgSize.width}
        height={svgSize.height}
        viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
        overflow="visible"
        fill="none"
      >
        {allBeams.map((beam) => {
          const startX = 0 + startXOffset;
          const endX = svgSize.width + endXOffset;
          const visualY = beam.type === "baseline" ? beam.y - 1 : beam.y + 1;
          const controlY = visualY - curvature;
          const d = `M ${startX},${visualY} Q ${(startX + endX) / 2},${controlY} ${endX},${visualY}`;

          return (
            <AnimatedBeamPath
              key={beam.key}
              d={d}
              id={beam.id}
              pathWidth={pathWidth}
              pathOpacity={pathOpacity}
              {...beam.trackProps}
            />
          );
        })}

        <defs>
          {allBeams.map((beam) => (
            <AnimatedBeamGradient
              key={beam.key}
              id={beam.id}
              reverse={reverse}
              delay={delay}
              duration={getDuration(beam.key)}
              {...beam.trackProps}
            />
          ))}
        </defs>
      </svg>
    </div>
  );
}

export { AnimatedTypographyBeams };
