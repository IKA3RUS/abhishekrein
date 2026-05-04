import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateSlices() {
  const count = Math.floor(random(1, 3));
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    top: random(0, 80),
    bottom: random(0, 80),
    tx: random(-8, 8),
    skew: random(-1, 5),
    sat: random(0.1, 1.4),
    contrast: random(0.9, 1.3),
    opacity: random(0.7, 1),
    blur: Math.random() < 0.2 ? random(0.5, 2) : 0,
  }));
}

type Rect = { left: number; top: number; width: number; height: number };

export function Glitch({
  children,
  active: controlledActive,
  container,
  zIndex = 9999,
}: {
  children: React.ReactNode;
  active?: boolean;
  container?: React.RefObject<Element | null>;
  zIndex?: number;
}) {
  const baseRef = useRef<HTMLSpanElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [slices, setSlices] = useState<any[]>([]);
  const rafRef = useRef<number>(null);
  const [internalActive, setInternalActive] = useState(false);

  const active = controlledActive ?? internalActive;

  useEffect(() => {
    if (controlledActive !== undefined) return;

    function trigger() {
      setInternalActive(true);
      setTimeout(() => setInternalActive(false), random(100, 200));
    }

    const interval = setInterval(trigger, random(4000, 8000));
    return () => clearInterval(interval);
  }, [controlledActive]);

  useLayoutEffect(() => {
    if (!active || !baseRef.current) return;

    const el = baseRef.current;

    const update = () => {
      const spanRect = el.getBoundingClientRect();
      const origin = container?.current?.getBoundingClientRect();
      setRect({
        left: origin ? spanRect.left - origin.left : spanRect.left,
        top: origin ? spanRect.top - origin.top : spanRect.top,
        width: spanRect.width,
        height: spanRect.height,
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, [active, container]);

  useEffect(() => {
    if (!active) return;

    function loop() {
      setSlices(generateSlices());
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [active]);

  return (
    <>
      <span ref={baseRef}>{children}</span>

      {active &&
        rect &&
        createPortal(
          <div
            style={{
              position: container ? "absolute" : "fixed",
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              pointerEvents: "none",
              zIndex,
            }}
          >
            {slices.map((s) => (
              <div
                key={s.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: `inset(${s.top}% 0 ${s.bottom}%)`,
                  transform: `translateX(${s.tx}px) skewX(${s.skew}deg)`,
                  filter: `
                    hue-rotate(${s.hue}deg)
                    saturate(${s.sat})
                    contrast(${s.contrast})
                    blur(${s.blur}px)
                  `,
                  opacity: s.opacity,
                }}
              >
                {children}
              </div>
            ))}
          </div>,
          container?.current ?? document.body,
        )}
    </>
  );
}
