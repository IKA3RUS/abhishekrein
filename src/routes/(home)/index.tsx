import { createFileRoute } from "@tanstack/react-router";

import { EmailButton } from "@/components/composites/EmailButton";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderAction, HeaderLogo } from "@/components/layout/Header";

// Not the Clouds index, which pulls in three
import { CLOUD_URL } from "@/components/effects/Clouds/texture";

import { Hero } from "./-components/Hero";
import { Work } from "./-components/Work";

export const Route = createFileRoute("/(home)/")({
  // Clouds' texture, fetched with the page rather than after hydration; the
  // preloader holds until the clouds show. crossOrigin matches three's loader.
  head: () => ({
    links: [
      {
        rel: "preload",
        as: "image",
        href: CLOUD_URL,
        crossOrigin: "anonymous",
      },
    ],
  }),
  component: App,
});

function App() {
  return (
    <>
      <Header initial="collapsed">
        <HeaderLogo />
        <HeaderAction>
          <EmailButton />
        </HeaderAction>
      </Header>
      <div className="relative z-1 bg-white pb-28">
        <Hero />
        <Work />
      </div>
      <Footer />
    </>
  );
}
