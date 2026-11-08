const TRANSITION_PSEUDO = "::view-transition-image-pair(root)";

/** Converts a CSS color token to linear 0–1 RGB. */
function resolveColor(token: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
    token,
  );
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function readCover(element: Element, pseudo?: string) {
  return parseFloat(
    getComputedStyle(element, pseudo).getPropertyValue("--cover"),
  );
}

function findViewTransition() {
  return document
    .getAnimations()
    .find(
      (animation) =>
        (animation.effect as KeyframeEffect | null)?.pseudoElement ===
        TRANSITION_PSEUDO,
    );
}

export {
  TRANSITION_PSEUDO,
  findViewTransition,
  readCover,
  resolveColor,
};
