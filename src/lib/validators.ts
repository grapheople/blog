import { z } from "zod";

const tipTapContentSchema = z
  .object({ type: z.string() })
  .passthrough();

export const postCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug은 소문자/숫자/하이픈만 허용됩니다"),
  title: z.string().min(1).max(200),
  description: z.string().max(500).default(""),
  content: tipTapContentSchema,
  published: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
});

export type PostCreateInput = z.infer<typeof postCreateSchema>;

export const postUpdateSchema = postCreateSchema.partial();
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
