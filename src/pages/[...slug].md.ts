import type { APIRoute, GetStaticPaths } from 'astro';
import { getDocs, toMarkdown, type DocsEntry } from '../lib/docs';

/**
 * The Markdown source of every docs page, served next to it: /routing/controllers/ is also
 * /routing/controllers.md. The "Copy page" menu copies it, and links it for AI assistants.
 */
export const getStaticPaths = (async () => {
	const docs = await getDocs();
	return docs.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: DocsEntry }> = ({ props: { entry } }) =>
	new Response(`${toMarkdown(entry)}\n`, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
