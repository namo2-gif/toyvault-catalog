import { defineCollection, z } from 'astro:content';

const products = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    price: z.number(),
    description: z.string(),
    image: z.string(),
    inStock: z.boolean().default(true),
    featured: z.boolean().default(false),
    ageRange: z.string().optional(),
    brand: z.string().optional(),
  }),
});

export const collections = { products };