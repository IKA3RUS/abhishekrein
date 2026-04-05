import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/Header.tsx";

import { Hero } from "./-components/Hero";
import { Works } from "./-components/Works";

export const Route = createFileRoute("/(home)/")({ component: App });

function App() {
  return (
    <div className="">
      <Header />
      <Hero />
      <Works />
    </div>
  );
}
