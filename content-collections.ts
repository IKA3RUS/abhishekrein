import { defineCollection, defineConfig } from "@content-collections/core";
import { mdxParse } from "safe-mdx/parse";
import { z } from "zod";

import { calculateReadingMinutes } from "@/lib/reading-time";
import { extractToc } from "@/lib/remark-extract-toc";

const works = defineCollection({
  name: "works",
  directory: "./src/data/works",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    organizations: z.array(z.object({ name: z.string(), link: z.url() })),
    year: z.number().int(),
    team: z.array(
      z.object({
        role: z.string(),
        members: z.array(
          z.object({
            name: z.string(),
            website: z.url().optional(),
            x: z.url().optional(),
            linkedin: z.url().optional(),
            github: z.url().optional(),
          }),
        ),
      }),
    ),
    toolbox: z.array(z.string()),
    tags: z.array(z.string()),
    cover: z.object({
      type: z.enum(["image", "video"]),
      src: z.string(),
      poster: z.string().optional(),
    }),
    color: z
      .string()
      .regex(
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
        "color must be a hex code",
      ),
    content: z.string(),
  }),
  transform(doc) {
    const mdast = mdxParse(doc.content);
    return {
      ...doc,
      toc: extractToc(mdast),
      readingMinutes: calculateReadingMinutes(mdast),
    };
  },
});

export default defineConfig({
  content: [works],
});
