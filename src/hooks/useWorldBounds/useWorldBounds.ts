import { useThree } from "@react-three/fiber";

const maxWidthValues = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  "2xl": 672,
  "3xl": 768,
  "4xl": 896,
  "5xl": 1024,
  "6xl": 1152,
  "7xl": 1280,
} as const;

type MaxWidth = keyof typeof maxWidthValues;

/**
 * Returns the bounds of a Three.js canvas in world space units.
 *
 * @param maxWidth - Optional Tailwind max-w-* key to clamp the horizontal
 * bounds
 */
export function useWorldBounds(maxWidth?: MaxWidth) {
  const { viewport } = useThree();

  const maxWorldWidth = maxWidth
    ? maxWidthValues[maxWidth] / viewport.factor
    : Infinity;

  const right = Math.min(viewport.width / 2, maxWorldWidth / 2);
  const left = -right;
  const top = viewport.height / 2;
  const bottom = -top;

  const width = Math.min(viewport.width, maxWorldWidth);
  const height = viewport.height;

  const widthPx = width * viewport.factor;
  const heightPx = height * viewport.factor;

  const unclampedWidth = viewport.width;
  const unclampedWidthPx = unclampedWidth * viewport.factor;

  return {
    right,
    left,
    top,
    bottom,
    width,
    height,
    widthPx,
    heightPx,
    unclampedWidth,
    unclampedWidthPx,
  };
}
