import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * The Markdown source of every docs page, served next to it: /routing/controllers/ is also
 * /routing/controllers.md. The "Copy page" menu copies it, and links it for AI assistants.
 */
const site = 'https://pollora.dev';

export const getStaticPaths = (async () => {
	const docs = await getCollection('docs', (entry) => entry.data.template !== 'splash' && entry.id !== '404');
	return docs.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: CollectionEntry<'docs'> }> = ({ props: { entry } }) => {
	const { title, description } = entry.data;
	// Root-relative links would break once the Markdown is pasted elsewhere
	const body = (entry.body ?? '').trim().replace(/\]\(\/(?!\/)/g, `](${site}/`);
	const markdown = [
		`# ${title}`,
		description && `> ${description}`,
		`Source: ${site}/${entry.id}/`,
		body,
	].filter(Boolean).join('\n\n');

	return new Response(`${markdown}\n`, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
