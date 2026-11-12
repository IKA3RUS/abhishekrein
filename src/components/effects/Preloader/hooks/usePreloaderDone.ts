import { useEffect, useState } from "react";

import { preloaderDone } from "../utils";

/** Returns true once the preloader finishes or is skipped. */
function usePreloaderDone() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    preloaderDone.then(() => active && setDone(true));
    return () => {
      active = false;
    };
  }, []);

  return done;
}

export { usePreloaderDone };
