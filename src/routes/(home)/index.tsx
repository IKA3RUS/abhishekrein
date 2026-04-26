import { createFileRoute } from "@tanstack/react-router";

import { EmailButton } from "@/components/composites/EmailButton";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderAction, HeaderLogo } from "@/components/layout/Header";

import { Hero } from "./-components/Hero";
import { Works } from "./-components/Works";

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
      <div className="relative z-1 bg-white">
        <Hero />
        <Works />
      </div>
      <Footer />
    </>
  );
}
