import { createFileRoute, notFound } from "@tanstack/react-router";

import { MDXContent } from "@content-collections/mdx/react";
import { allWorks } from "content-collections";

function findWork(slug: string) {
  const work = allWorks.find((work) => work._meta.path === slug);
  if (!work) {
    throw notFound();
  }
  return work;
}

export const Route = createFileRoute("/work/$work/")({
  loader: ({ params: { work } }) => findWork(work),
  component: Work,
});

function Work() {
  const work = Route.useLoaderData();

  return (
    <div>
      <h1>{work.title}</h1>
      <p>{work.description}</p>
      <MDXContent code={work.mdx} />
    </div>
  );
}
