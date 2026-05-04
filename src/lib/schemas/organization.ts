import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string(),
  websiteUrl: z.url(),
});

export type Organization = z.infer<typeof organizationSchema>;
