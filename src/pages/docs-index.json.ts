import type { APIRoute } from 'astro';
import { getDocs, sections, toMarkdown, toSections } from '../lib/docs';

const sectionKeys = Object.keys(sections);
const rank = (path: string) => sectionKeys.indexOf(path.split('/')[0]);

/**
 * Every docs page as data, cut into sections: what the docs MCP server (api/mcp.ts) searches
 * and serves. Built with the site, so the server always answers from the deployed docs.
 */
export const GET: APIRoute = async () => {
	const docs = await getDocs();
	const pages = docs
		.map((entry) => ({
			path: entry.id,
			title: entry.data.title,
			description: entry.data.description ?? '',
			section: sections[entry.id.split('/')[0]] ?? 'About Pollora',
			markdown: toMarkdown(entry),
			sections: toSections(entry),
			order: entry.data.sidebar.order ?? Infinity,
		}))
		// Sidebar order: About Pollora first, then each section, then the page order inside it
		.sort((a, b) => rank(a.path) - rank(b.path) || a.order - b.order || a.title.localeCompare(b.title))
		.map(({ order, ...page }) => page);

	return new Response(JSON.stringify({ pages }), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
