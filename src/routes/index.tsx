import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/Header.tsx";

import { Hero } from "./-sections/Hero";
import { Works } from "./-sections/Works";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="">
      <Header />
      <Hero />
      <Works />
    </div>
  );
}
