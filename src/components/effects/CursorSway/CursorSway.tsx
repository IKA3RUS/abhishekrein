import { useEffect, useRef, type ReactNode } from "react";

import { motion, useSpring } from "motion/react";

const PROXIMITY_RADIUS = 90;
const MAX_SHIFT = 7;

function CursorSway({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 280, damping: 22, mass: 0.6 });
  const y = useSpring(0, { stiffness: 280, damping: 22, mass: 0.6 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PROXIMITY_RADIUS) {
        const t = 1 - dist / PROXIMITY_RADIUS;
        x.set((dx / dist) * t * MAX_SHIFT);
        y.set((dy / dist) * t * MAX_SHIFT);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [x, y]);

  return (
    <motion.div ref={ref} style={{ x, y }} className="inline-flex">
      {children}
    </motion.div>
  );
}

export { CursorSway };
