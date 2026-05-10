import { Fragment } from "react";

import { createFileRoute, notFound } from "@tanstack/react-router";

import { noCase } from "change-case";
import { allDetailedWorks } from "content-collections";
import { SafeMdxRenderer } from "safe-mdx";
import { mdxParse } from "safe-mdx/parse";

import { Video } from "@/components/primitives/Video";

import { EmailButton } from "@/components/composites/EmailButton";
import { OrganizationLogo } from "@/components/composites/OrganizationLogo";
import { ReadingMinutesChip } from "@/components/composites/ReadingMinutesChip/ReadingMinutesChip";
import { Toc } from "@/components/composites/Toc";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderAction, HeaderLogo } from "@/components/layout/Header";

import { AnimatedTypographyBeams } from "@/components/effects/AnimatedTypographyBeams";

import { addBlockquoteCite } from "@/lib/remark/remark-blockquote-cite";
import { addHeadingLinks } from "@/lib/remark/remark-heading-links";

import { Gallery, GalleryImage, GalleryVideo } from "./-components/Gallery";
import { RealResult, RealResults } from "./-components/RealResults";
import { Section } from "./-components/Section";
import { Tags } from "./-components/Tags";
import { TeamChip } from "./-components/TeamChip";
import { ToolboxChip } from "./-components/ToolboxChip";
import { YearChip } from "./-components/YearChip";

import CloseSmallIcon from "@material-symbols/svg-700/sharp/close_small-fill.svg?react";

function findWork(slug: string) {
  const work = allDetailedWorks.find((work) => work._meta.path === slug);
  if (!work) {
    throw notFound();
  }
  return work;
}

export const Route = createFileRoute("/work/$work/")({
  loader: ({ params: { work: slug } }) => {
    const work = findWork(slug);
    const mdast = mdxParse(work.content);

    const contextNode = mdast.children.find(
      (node) =>
        node.type === "mdxJsxFlowElement" &&
        (node as any).name === "Section" &&
        (node as any).attributes?.some(
          (attr: any) => attr.name === "id" && attr.value === "context",
        ),
    );
    const contextMdast = {
      type: "root" as const,
      children: contextNode ? [contextNode] : [],
    };
    const bodyMdast = {
      type: "root" as const,
      children: mdast.children.filter((n) => n !== contextNode),
    };

    addHeadingLinks(bodyMdast);
    addBlockquoteCite(bodyMdast);

    return {
      ...work,
      contextMdast,
      bodyMdast,
    };
  },
  component: Work,
});

function Work() {
  const work = Route.useLoaderData();

  return (
    <>
      <Header>
        <HeaderLogo className="fill-violet-7" />
        <HeaderAction>
          <EmailButton />
        </HeaderAction>
      </Header>
      <div className="relative z-1 bg-white">
        <article
          className="mx-auto prose mt-26 flex max-w-480 flex-col gap-9 p-9 prose-zinc selection:bg-violet-7 selection:text-white sm:gap-18 sm:p-20 prose-headings:mx-auto prose-headings:max-w-172.5 prose-headings:text-neutral-4 prose-h1:typography-head-1 prose-h1:text-(--work-color,var(--tw-prose-headings)) prose-h2:typography-head-3 prose-h2:text-(--work-color,var(--tw-prose-headings)) lg:prose-h2:typography-head-2 prose-h3:typography-head-4 lg:prose-h3:typography-head-3 prose-h4:typography-head-5 lg:prose-h4:typography-head-4 prose-h5:typography-head-6 lg:prose-h5:typography-head-5 prose-h6:typography-head-6 prose-p:mx-auto prose-p:max-w-172.5 prose-p:typography-text-2 prose-a:text-inherit prose-a:no-underline prose-blockquote:prose-p:typography-head-6 prose-figure:mx-auto prose-figcaption:typography-text-3 prose-figcaption:text-neutral-6 prose-figcaption:select-text [&_a:not(:is(h1,h2,h3,h4,h5,h6)_a):not(:where([class~='not-prose'],[class~='not-prose']_*))]:text-(--work-color,inherit) [&_figcaption]:select-text [&_figure:has(>blockquote)]:flex [&_figure:has(>blockquote)]:max-w-172.5 [&_figure:has(>blockquote)]:flex-col [&_figure>blockquote]:border-0 [&_figure>blockquote]:p-0 [&_figure>blockquote]:typography-head-6 [&_figure>blockquote]:not-italic [&_figure>blockquote]:[quotes:none] [&_figure>blockquote_p]:inline [&_figure>blockquote_p]:bg-(--work-color) [&_figure>blockquote_p]:[box-decoration-break:clone] [&_figure>blockquote_p]:px-1 [&_figure>blockquote_p]:text-white [&_figure>blockquote~figcaption]:mt-4 [&_figure>blockquote~figcaption]:typography-text-2 [&_figure>blockquote~figcaption]:text-neutral-5 [&_figure>blockquote~figcaption]:not-italic [&_p]:select-text [&_section>span+*]:mt-4"
          style={{ "--work-color": work.color } as React.CSSProperties}
        >
          <>
            <div className="mx-auto flex w-full max-w-172.5 items-center justify-start gap-4">
              {work.organizations.map((organization, index) => (
                <Fragment key={organization.name}>
                  {index > 0 && (
                    <CloseSmallIcon
                      aria-hidden
                      className="fill-neutral-60 size-4"
                    />
                  )}
                  <OrganizationLogo
                    organization={organization.name}
                    color={work.color}
                  />
                </Fragment>
              ))}
            </div>
            <AnimatedTypographyBeams
              edgeToEdge
              pathWidth={1}
              pathColor="var(--color-neutral-5)"
              gradientStartColor={work.color}
              gradientStopColor={`${work.color}00`}
            >
              <h1 className="relative z-1 my-0!">
                <a href="#">{work.title.toLowerCase()}</a>
              </h1>
            </AnimatedTypographyBeams>
            <SafeMdxRenderer
              mdast={work.contextMdast}
              components={{
                a: (props: React.ComponentProps<"a">) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
                Section,
              }}
            />
          </>
          <div className="not-prose flex w-full flex-col items-start justify-between gap-16 sm:-mt-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-3">
              <YearChip year={work.year} />
              <ReadingMinutesChip minutes={work.readingMinutes} />
              <Tags tags={work.tags} color={work.color} />
            </div>
            <div className="ml-auto flex flex-col items-end gap-3">
              <TeamChip team={work.team} color={work.color} />
              <ToolboxChip toolbox={work.toolbox} color={work.color} />
            </div>
          </div>
          <div className="not-prose my-9 flex aspect-21/9 items-center overflow-hidden sm:my-auto">
            {work.cover.type === "image" && (
              <img
                src={`/images/work/${noCase(work._meta.path)}/${work.cover.filename}`}
                alt={work.title}
                className="h-full w-auto object-cover"
              />
            )}
            {work.cover.type === "video" && (
              <Video
                src={`/videos/work/${noCase(work._meta.path)}/${work.cover.filename}`}
                className="aspect-video w-full object-cover"
                lazy={false}
              />
            )}
          </div>
          <div className="relative flex w-full flex-col gap-16 xl:block">
            <div className="pointer-events-none inset-0 z-1 xl:absolute">
              <div className="flex w-full justify-end xl:sticky xl:top-52">
                <Toc
                  className="pointer-events-auto w-full xl:w-48 2xl:w-68"
                  toc={work.toc}
                />
              </div>
            </div>
            <div className="w-full">
              <SafeMdxRenderer
                mdast={work.bodyMdast}
                components={{
                  a: (props: React.ComponentProps<"a">) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                  figure: "figure",
                  figcaption: "figcaption",
                  cite: "cite",
                  Section,
                  RealResults,
                  RealResult,
                  Gallery,
                  GalleryImage: (
                    props: Omit<
                      React.ComponentProps<typeof GalleryImage>,
                      "basepath"
                    >,
                  ) => (
                    <GalleryImage
                      basepath={`/images/work/${noCase(work._meta.path)}/`}
                      {...props}
                    />
                  ),
                  GalleryVideo: (
                    props: Omit<
                      React.ComponentProps<typeof GalleryImage>,
                      "basepath"
                    >,
                  ) => (
                    <GalleryVideo
                      basepath={`/videos/work/${noCase(work._meta.path)}/`}
                      {...props}
                    />
                  ),
                }}
              />
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
