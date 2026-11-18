import { type RefObject, useCallback, useRef } from "react";

import { type Reveal, createReveal } from "../reveal";

const HEAT_FILTER_ID = "burn-transition-heat";
const SVG_NS = "http://www.w3.org/2000/svg";

interface Mask {
  canvas: HTMLCanvasElement;
  reveal: Reveal;
  style: HTMLStyleElement;
}

/**
 * Distorts the old page around the fire. Shares the mask's renderer,
 * switching its mode for each draw.
 */
interface Heat {
  reveal: Reveal;
  /** Renderer mode that draws the map */
  mode: "heat";
  /** Applies the last draw to the old page */
  update: () => void;
  /** Removes the distortion */
  reset: () => void;
}

/** Returns a 1px data URL of the grey that means no displacement. */
function createNeutralMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "rgb(128, 128, 128)";
  context.fillRect(0, 0, 1, 1);
  return canvas.toDataURL();
}

/** Creates an SVG filter that displaces its input by the heat map. */
function createHeatFilter() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";

  // Filters in sRGB so that 0.5 in the map means no displacement.
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.id = HEAT_FILTER_ID;
  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", "1");
  filter.setAttribute("height", "1");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const image = document.createElementNS(SVG_NS, "feImage");
  image.setAttribute("preserveAspectRatio", "none");
  image.setAttribute("result", "map");

  const displace = document.createElementNS(SVG_NS, "feDisplacementMap");
  displace.setAttribute("in", "SourceGraphic");
  displace.setAttribute("in2", "map");
  // Displacement range of the heat map in CSS px
  displace.setAttribute("scale", "56");
  displace.setAttribute("xChannelSelector", "R");
  displace.setAttribute("yChannelSelector", "G");

  filter.append(image, displace);
  svg.append(filter);
  document.body.append(svg);
  return image;
}

/** Displaces the old page by the map with an SVG filter. */
function createWarp(mask: Mask, style: HTMLStyleElement): Heat {
  const image = createHeatFilter();
  // An empty map would shift the whole page, so the filter starts from the
  // neutral grey.
  const neutral = createNeutralMap();
  image.setAttribute("href", neutral);
  return {
    reveal: mask.reveal,
    mode: "heat",
    update() {
      style.textContent ||= `::view-transition-old(root) { filter: url(#${HEAT_FILTER_ID}); }`;
      image.setAttribute("href", mask.canvas.toDataURL());
    },
    reset() {
      style.textContent = "";
      image.setAttribute("href", neutral);
    },
  };
}

/** Creates the renderers on first use and draws them in step with CSS animations. */
function useReveal(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const revealRef = useRef<Reveal | null>(null);
  const maskRef = useRef<Mask | null>(null);
  const heatRef = useRef<Heat | null>(null);
  const frameRef = useRef(0);

  const getReveal = useCallback(() => {
    revealRef.current ??= createReveal(canvasRef.current!, "fill");
    return revealRef.current;
  }, [canvasRef]);

  const getMask = useCallback(() => {
    if (!maskRef.current) {
      const canvas = document.createElement("canvas");
      // 8 cells per pixel. The heat filter upsamples it smoothly.
      const reveal = createReveal(canvas, "mask", 8);
      if (!reveal) return null;
      const style = document.createElement("style");
      document.head.append(style);
      maskRef.current = { canvas, reveal, style };
    }
    return maskRef.current;
  }, []);

  const getHeat = useCallback(() => {
    if (!heatRef.current) {
      const mask = getMask();
      if (!mask) return null;
      const style = document.createElement("style");
      document.head.append(style);
      heatRef.current = createWarp(mask, style);
    }
    return heatRef.current;
  }, [getMask]);

  /** Draws each frame until the animation finishes. */
  const follow = useCallback(
    (
      animation: Animation,
      read: () => number,
      onFrame?: (time: number, progress: number) => void,
    ) => {
      const reveal = getReveal();
      cancelAnimationFrame(frameRef.current);

      return new Promise<void>((resolve) => {
        const tick = (time: number) => {
          if (
            animation.playState === "finished" ||
            animation.playState === "idle"
          ) {
            reveal?.clear();
            resolve();
            return;
          }
          // Read once per frame as it forces a style lookup
          const progress = read();
          reveal?.draw(progress, time);
          onFrame?.(time, progress);
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      });
    },
    [getReveal],
  );

  const stop = useCallback(() => cancelAnimationFrame(frameRef.current), []);

  return { getReveal, getMask, getHeat, follow, stop };
}

type RevealControls = ReturnType<typeof useReveal>;

export { type RevealControls, useReveal };
