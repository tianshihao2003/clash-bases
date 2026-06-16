import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const bases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/bases' }),
  schema: z.object({
    name: z.string().default(''),
    thLevel: z.number().min(1).max(18),
    usage: z.enum(['war', 'farm', 'trophy', 'hybrid']),
    image: z.string(),
    isFeatured: z.boolean().default(false),
    createdAt: z.string(),
    copyLink: z.string().optional(),
  }),
});

export const collections = { bases };
