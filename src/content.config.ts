import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Blog posts: one Markdown file per post in src/content/blog/, the file name is the slug
	blog: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
		schema: z.object({
			title: z.string(),
			// The standfirst under the title, also the meta description
			description: z.string(),
			date: z.coerce.date(),
			category: z.enum(['announcement', 'release', 'tutorial', 'roadmap']),
			// A key of `authors` in src/lib/blog.ts
			author: z.string().default('Olivier Gorzalka'),
			// Release posts: the version they announce, shown as a badge
			version: z.string().optional(),
			draft: z.boolean().default(false),
		}),
	}),
};
