import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(10),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string().min(1)).min(1),
    series: z.string().optional(),
    seriesOrder: z.number().int().positive().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  }).refine(
    (entry) => !entry.series || entry.seriesOrder !== undefined,
    { message: "series 文章必须提供 seriesOrder" }
  )
});

export const collections = { blog };
