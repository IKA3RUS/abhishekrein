/** Resolves when all of the named CSS animations on the element and its descendants finish. */
function cssAnimationsFinished(element: HTMLElement, names: string[]) {
  const animations = element
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation instanceof CSSAnimation &&
        names.includes(animation.animationName),
    );
  return Promise.all(animations.map((animation) => animation.finished)).then(
    () => {},
    () => {},
  );
}

/** Sets the --exit-* properties so the landing outline lands on [data-preloader-target]. Fades out without a target. */
function aimExit(preloader: HTMLElement) {
  const from = preloader.querySelector("path")?.getBoundingClientRect();
  const target = document.querySelector("[data-preloader-target] path");
  const to = target?.getBoundingClientRect();
  if (!from?.width || !to?.width) {
    preloader.style.setProperty("--exit-opacity", "0");
    return;
  }

  // Transforms the whole preloader about its centre.
  const box = preloader.getBoundingClientRect();
  const origin = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const scale = to.width / from.width;
  const offset = (fromCentre: number, toCentre: number, originAxis: number) =>
    toCentre - originAxis - scale * (fromCentre - originAxis);

  preloader.style.setProperty(
    "--exit-x",
    `${offset(from.x + from.width / 2, to.x + to.width / 2, origin.x)}px`,
  );
  preloader.style.setProperty(
    "--exit-y",
    `${offset(from.y + from.height / 2, to.y + to.height / 2, origin.y)}px`,
  );
  preloader.style.setProperty("--exit-scale", `${scale}`);
  preloader.style.setProperty("--exit-fill", getComputedStyle(target!).fill);
}

function figureRoot(object: HTMLObjectElement | null) {
  // Avoids instanceof, which fails across windows.
  const root = object?.contentDocument?.documentElement as
    | SVGSVGElement
    | undefined;
  return root && "getCurrentTime" in root ? root : undefined;
}

/** Sets data-preloader-figure on <html> once figure.svg loads. Runs inline, so it must be self-contained. */
function watchPreloaderFigure() {
  // Captures because element load events do not bubble.
  document.addEventListener(
    "load",
    (event) => {
      if ((event.target as Element).classList?.contains("preloader-object")) {
        document.documentElement.setAttribute("data-preloader-figure", "");
      }
    },
    true,
  );
}

/** Sets data-preloader-seen on <html> after the first load in a session, except on reloads, which cover the page while it loads again. Runs inline, so it must be self-contained. */
function markPreloaderSeen() {
  const key = "preloader-seen";
  const [navigation] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  try {
    if (sessionStorage.getItem(key) && navigation?.type !== "reload") {
      document.documentElement.setAttribute("data-preloader-seen", "");
    } else {
      sessionStorage.setItem(key, "1");
    }
  } catch {
    // Ignores missing storage.
  }
}

let resolvePreloaderDone = () => {};

/** Resolves once the preloader finishes or is skipped. */
const preloaderDone = new Promise<void>((resolve) => {
  resolvePreloaderDone = resolve;
});

function markPreloaderDone() {
  resolvePreloaderDone();
}

function preloaderSeen() {
  return document.documentElement.hasAttribute("data-preloader-seen");
}

export {
  aimExit,
  cssAnimationsFinished,
  figureRoot,
  preloaderDone,
  preloaderSeen,
  markPreloaderDone,
  markPreloaderSeen,
  watchPreloaderFigure,
};
