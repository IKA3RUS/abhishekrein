import { usePreloaderDone } from "@/components/effects/Preloader";

import { Video } from "./Video";

/** Renders a Video that waits for the preloader to finish, which needs the bandwidth. */
function DeferredVideo(
  props: Omit<React.ComponentProps<typeof Video>, "deferred">,
) {
  const preloaderDone = usePreloaderDone();
  return <Video {...props} deferred={!preloaderDone} />;
}

export { DeferredVideo };
