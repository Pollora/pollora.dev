import GithubSlugger from 'github-slugger';
import { getCollection, type CollectionEntry } from 'astro:content';

/** Shared by the Markdown version of each docs page and the index the MCP server searches. */
export const site = 'https://pollora.dev';

/** Docs sections, in sidebar order. */
export const sections: Record<string, string> = {
	'getting-started': 'Getting Started', guides: 'Guides', 'core-concepts': 'Core Concepts',
	routing: 'Routing', content: 'Content', hooks: 'Hooks & Events', theming: 'Theming',
	blocks: 'Blocks', advanced: 'Advanced', nectar: 'Nectar AI',
};

export type DocsEntry = CollectionEntry<'docs'>;

export const getDocs = () =>
	getCollection('docs', (entry) => entry.data.template !== 'splash' && entry.id !== '404');

/** The page body with root-relative links made absolute: they would break once pasted elsewhere. */
const absoluteBody = (entry: DocsEntry) => (entry.body ?? '').trim().replace(/\]\(\/(?!\/)/g, `](${site}/`);

export function toMarkdown(entry: DocsEntry) {
	const { title, description } = entry.data;
	return [`# ${title}`, description && `> ${description}`, `Source: ${site}/${entry.id}/`, absoluteBody(entry)]
		.filter(Boolean)
		.join('\n\n');
}

/** Heading text as rendered, which is what Astro slugs into the heading id. */
const plainHeading = (text: string) =>
	text
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[`*]/g, '')
		// Underscores are emphasis only at word edges: add_action and pollora_status keep theirs
		.replace(/(^|\s)_+|_+(?=\s|$)/g, '$1')
		.trim();

/**
 * The page cut at its h2 and h3 headings, each part with the anchor of its heading, so a search
 * hit can link to the exact section. Headings inside fenced code blocks are not headings.
 */
export function toSections(entry: DocsEntry) {
	const slugger = new GithubSlugger();
	const parts: { heading: string; anchor: string; text: string[] }[] = [{ heading: '', anchor: '', text: [] }];
	let fence: string | null = null;

	for (const line of absoluteBody(entry).split('\n')) {
		const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
		if (marker && (!fence || marker.startsWith(fence))) fence = fence ? null : marker;
		const heading = !fence && line.match(/^(#{2,3})\s+(.+?)\s*#*$/);
		if (heading) {
			const text = plainHeading(heading[2]);
			parts.push({ heading: text, anchor: slugger.slug(text), text: [] });
		} else {
			parts.at(-1)!.text.push(line);
		}
	}

	return (
		parts
			// Synced pages open on a hand-written table of contents: links to their own headings
			.map(({ heading, anchor, text }) => ({
				heading,
				anchor,
				text: text.filter((line) => !/^\s*[-*]\s*\[[^\]]*\]\(#[^)]*\)\s*$/.test(line)).join('\n').trim(),
			}))
			.filter((part) => part.text || (part.heading && !/^table of contents$/i.test(part.heading)))
	);
}
