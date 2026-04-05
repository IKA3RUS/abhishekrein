import { Link } from "@tanstack/react-router";

import { allWorks } from "content-collections";

export function Works() {
  return (
    <section className="p-4">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-4">
        {allWorks.map((work) => (
          <Link
            key={work._meta.path}
            to="/work/$work"
            params={{ work: work._meta.path }}
            className="border border-neutral-2 p-4"
          >
            <h2 className="typography-label-2 uppercase">{work.title}</h2>
          </Link>
        ))}
      </div>
    </section>
  );
}
