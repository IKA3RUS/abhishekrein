import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

const works = defineCollection({
  name: "works",
  directory: "./src/data/works",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    content: z.string(),
  }),
});

export default defineConfig({
  content: [works],
});
