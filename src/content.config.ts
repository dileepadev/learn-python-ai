import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const lessons = defineCollection({
  loader: glob({ base: "./src/content/lessons", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Must match a slug in src/lib/curriculum.ts */
    module: z.string(),
    order: z.number(),
    level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
    /** Rough reading + doing time, in minutes. */
    minutes: z.number().default(10),
    objectives: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { lessons };
