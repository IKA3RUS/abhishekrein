import { defineCollection, defineConfig } from "@content-collections/core";
import { mdxParse } from "safe-mdx/parse";
import { z } from "zod";

import { calculateReadingMinutes } from "@/lib/reading-time";
import { extractToc } from "@/lib/remark/remark-extract-toc";
import { coverSchema } from "@/lib/schemas/cover";
import { memberSchema } from "@/lib/schemas/member";
import { organizationSchema } from "@/lib/schemas/organization";

const baseWorkSchema = z.object({
  title: z.string(),
  description: z.string(),
  organizations: z.array(organizationSchema),
  year: z.number().int(),
  team: z.array(
    z.object({
      role: z.string(),
      members: z.array(memberSchema),
    }),
  ),
  toolbox: z.array(z.string()),
  tags: z.array(z.string()),
  cover: coverSchema,
  color: z
    .string()
    .regex(
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
      "color must be a hex code",
    ),
});

const detailedWorks = defineCollection({
  name: "detailedWorks",
  directory: "./src/data/work",
  include: "*.mdx",
  schema: baseWorkSchema.extend({
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

const linkedWorks = defineCollection({
  name: "linkedWorks",
  directory: "./src/data/work",
  include: "*.json",
  parser: "json",
  schema: baseWorkSchema.extend({
    workUrl: z.url(),
    readingMinutes: z.int(),
  }),
});

export default defineConfig({
  content: [detailedWorks, linkedWorks],
});
