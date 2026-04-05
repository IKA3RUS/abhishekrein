import { createFileRoute, notFound } from "@tanstack/react-router";

import { allWorks } from "content-collections";
import { SafeMdxRenderer } from "safe-mdx";
import { mdxParse } from "safe-mdx/parse";

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
  const mdast = mdxParse(work.content);

  return (
    <div>
      <h1>{work.title}</h1>
      <p>{work.description}</p>
      <SafeMdxRenderer markdown={work.content} mdast={mdast} components={{}} />
    </div>
  );
}
