import { type VariantProps, cva } from "class-variance-authority";

import { Video } from "@/components/primitives/Video";

import { CursorSway } from "@/components/effects/CursorSway";

import { cn } from "@/lib/cn";
import type { Member } from "@/lib/schemas/member";

import { MemberChip } from "./MemberChip";

const galleryVariants = cva("not-prose mt-19 mb-19 gap-9 lg:mt-22 lg:mb-22", {
  variants: {
    type: {
      grid: "grid",
      masonry: "*:mb-9 *:break-inside-avoid",
    },
    columns: {
      1: "columns-1 grid-cols-1",
      2: "columns-1 grid-cols-1 lg:columns-2 lg:grid-cols-2",
      3: "columns-1 grid-cols-1 lg:columns-3 lg:grid-cols-3",
      4: "columns-1 grid-cols-1 lg:columns-4 lg:grid-cols-4",
    },
  },
  defaultVariants: {
    type: "grid",
    columns: 2,
  },
});

export function Gallery({
  children,
  className,
  ...variants
}: {
  children?: React.ReactNode;
  className?: string;
} & VariantProps<typeof galleryVariants>) {
  return (
    <div className={cn(galleryVariants(variants), className)}>{children}</div>
  );
}

const galleryItemVariants = cva("@container flex w-full flex-col gap-4", {
  variants: {
    columnSpan: {
      1: "lg:col-span-1",
      2: "lg:col-span-2",
      3: "lg:col-span-3",
      4: "lg:col-span-4",
    },
    rowSpan: {
      1: "lg:row-span-1",
      2: "lg:row-span-2",
      3: "lg:row-span-3",
      4: "lg:row-span-4",
    },
  },
});

const mediaContainerVariants = cva(
  "relative flex size-full justify-center transition-[padding]",
  {
    variants: {
      align: {
        center: "items-center p-4 @sm:p-8 @lg:p-16 @2xl:p-24 @4xl:p-36",
        top: "items-start px-4 pb-4 @sm:px-8 @sm:pb-8 @lg:px-16 @lg:pb-16 @2xl:px-24 @2xl:pb-24 @4xl:px-36 @4xl:pb-36",
        bottom:
          "items-end px-4 pt-4 @sm:px-8 @sm:pt-8 @lg:px-16 @lg:pt-16 @2xl:px-24 @2xl:pt-24 @4xl:px-36 @4xl:pt-36",
        none: "",
      },
    },
    defaultVariants: {
      align: "center",
    },
  },
);

function buildAuthor(
  name?: string,
  websiteUrl?: string,
  xUrl?: string,
  linkedinUrl?: string,
  behanceUrl?: string,
  githubUrl?: string,
): Member | undefined {
  if (!name) return undefined;
  return { name, websiteUrl, xUrl, linkedinUrl, behanceUrl, githubUrl };
}

export function GalleryImage({
  basepath,
  filename,
  alt,
  caption,
  backgroundColor,
  authorName,
  authorWebsiteUrl,
  authorXUrl,
  authorLinkedinUrl,
  authorBehanceUrl,
  authorGithubUrl,
  ...variants
}: {
  basepath: string;
  filename: string;
  alt?: string;
  caption?: string;
  backgroundColor?: string;
  authorName?: string;
  authorWebsiteUrl?: string;
  authorXUrl?: string;
  authorLinkedinUrl?: string;
  authorBehanceUrl?: string;
  authorGithubUrl?: string;
} & VariantProps<typeof galleryItemVariants> &
  VariantProps<typeof mediaContainerVariants>) {
  const author = buildAuthor(
    authorName,
    authorWebsiteUrl,
    authorXUrl,
    authorLinkedinUrl,
    authorBehanceUrl,
    authorGithubUrl,
  );
  return (
    <figure className={galleryItemVariants(variants)}>
      <div
        className={mediaContainerVariants(variants)}
        style={{ backgroundColor: backgroundColor ?? "var(--color-neutral-1)" }}
      >
        <img
          className="object-cover"
          src={basepath + filename}
          alt={alt || `An image of a piece of work in this project`}
        />
        {author && (
          <div className="absolute top-4 left-4">
            <CursorSway>
              <MemberChip member={author} />
            </CursorSway>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="typography-text-2 text-neutral-6">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function GalleryVideo({
  basepath,
  filename,
  alt,
  caption,
  backgroundColor,
  authorName,
  authorWebsiteUrl,
  authorXUrl,
  authorLinkedinUrl,
  authorBehanceUrl,
  authorGithubUrl,
  width,
  height,
  ...variants
}: {
  basepath: string;
  filename: string;
  alt?: string;
  caption?: string;
  backgroundColor?: string;
  authorName?: string;
  authorWebsiteUrl?: string;
  authorXUrl?: string;
  authorLinkedinUrl?: string;
  authorBehanceUrl?: string;
  authorGithubUrl?: string;
  width?: number;
  height?: number;
} & VariantProps<typeof galleryItemVariants> &
  VariantProps<typeof mediaContainerVariants>) {
  const author = buildAuthor(
    authorName,
    authorWebsiteUrl,
    authorXUrl,
    authorLinkedinUrl,
    authorBehanceUrl,
    authorGithubUrl,
  );
  return (
    <figure className={galleryItemVariants(variants)}>
      <div
        className={mediaContainerVariants(variants)}
        style={{ backgroundColor: backgroundColor ?? "var(--color-neutral-1)" }}
      >
        <Video
          src={basepath + filename}
          aria-label={alt || "A video of a piece of work in this project"}
          width={width}
          height={height}
          lazy
        />
        {author && (
          <div className="absolute top-4 left-4">
            <CursorSway>
              <MemberChip member={author} />
            </CursorSway>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="typography-text-2 text-neutral-6">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
