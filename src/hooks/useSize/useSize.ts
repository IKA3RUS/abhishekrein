import { useLayoutEffect, useState } from "react";

export function useSize<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = {
        width: rect.width,
        height: rect.height,
      };

      setSize((prev) =>
        prev.width !== next.width || prev.height !== next.height ? next : prev,
      );
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, [ref]);

  return size;
}
