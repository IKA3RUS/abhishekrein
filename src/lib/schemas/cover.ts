import { z } from "zod";

export const coverSchema = z.object({
  type: z.enum(["image", "video"]),
  filename: z.string(),
});

export type Cover = z.infer<typeof coverSchema>;
