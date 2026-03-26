import { createFileRoute } from "@tanstack/react-router";

import { Hero } from "./-sections/Hero";
import { Header } from "@/components/Header.tsx";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="">
      <Header />
      <Hero />
    </div>
  );
}
