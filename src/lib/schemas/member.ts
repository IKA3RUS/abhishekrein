import { z } from "zod";

export const memberSchema = z.object({
  name: z.string(),
  websiteUrl: z.url().optional(),
  xUrl: z.url().optional(),
  linkedinUrl: z.url().optional(),
  behanceUrl: z.url().optional(),
  githubUrl: z.url().optional(),
});

export type Member = z.infer<typeof memberSchema>;
