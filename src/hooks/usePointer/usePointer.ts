import { useEffect } from "react";

type Pointer = { current: { x: number; y: number } | null };

const pointer: Pointer = { current: null };
let subscribers = 0;

function handleMove(event: PointerEvent) {
  if (pointer.current) {
    pointer.current.x = event.clientX;
    pointer.current.y = event.clientY;
  } else {
    pointer.current = { x: event.clientX, y: event.clientY };
  }
}

function handleLeave(event: PointerEvent) {
  if (!event.relatedTarget) pointer.current = null;
}

/**
 * Returns the latest pointer position in client px, or null while the pointer
 * is off the page. Read it in event or frame callbacks, not during render.
 */
export function usePointer(): Pointer {
  useEffect(() => {
    if (subscribers++ === 0) {
      window.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerout", handleLeave);
    }
    return () => {
      if (--subscribers > 0) return;
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerout", handleLeave);
      pointer.current = null;
    };
  }, []);

  return pointer;
}
