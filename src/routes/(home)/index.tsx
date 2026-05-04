import { createFileRoute } from "@tanstack/react-router";

import { EmailButton } from "@/components/composites/EmailButton";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderAction, HeaderLogo } from "@/components/layout/Header";

import { Hero } from "./-components/Hero";
import { Work } from "./-components/Work";

export const Route = createFileRoute("/(home)/")({ component: App });

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
