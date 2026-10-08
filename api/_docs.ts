/**
 * Search over the docs index (/docs-index.json, built by src/pages/docs-index.json.ts).
 * The leading underscore keeps Vercel from deploying this file as a function.
 */
export type Section = { heading: string; anchor: string; text: string };
export type Page = {
	path: string;
	title: string;
	description: string;
	section: string;
	markdown: string;
	sections: Section[];
};

export type Hit = { page: Page; section: Section; score: number };

const site = 'https://pollora.dev';
const ttl = 5 * 60 * 1000;
let cache: { pages: Page[]; at: number } | undefined;

/**
 * The index of the deployment serving the request, kept for a few minutes per instance.
 * Preview deployments are protected: the caller's access (Vercel cookie or bypass token)
 * is passed on, so a preview answers whoever may open it.
 */
export async function loadPages(request: Request): Promise<Page[]> {
	if (cache && Date.now() - cache.at < ttl) return cache.pages;
	const headers = new Headers();
	for (const name of ['cookie', 'x-vercel-protection-bypass']) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}
	const response = await fetch(new URL('/docs-index.json', request.url), { headers, redirect: 'manual' });
	if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
		throw new Error(`Docs index unavailable (${response.status})`);
	}
	const { pages } = (await response.json()) as { pages: Page[] };
	cache = { pages, at: Date.now() };
	return pages;
}

export const pageUrl = (page: Page, anchor = '') => `${site}/${page.path}/${anchor ? `#${anchor}` : ''}`;

const tokenize = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];

const count = (haystack: string, needle: string) => {
	let n = 0;
	for (let i = haystack.indexOf(needle); i !== -1 && n < 5; i = haystack.indexOf(needle, i + needle.length)) n++;
	return n;
};

/**
 * Ranks every section of every page: a term in the page title weighs most, then the section
 * heading, the page description and the section text. Sections missing terms are penalised,
 * and the whole query found as written earns a bonus.
 */
export function search(pages: Page[], query: string, limit: number): Hit[] {
	const terms = [...new Set(tokenize(query))];
	if (!terms.length) return [];
	const phrase = query.toLowerCase().trim();
	const hits: Hit[] = [];

	for (const page of pages) {
		const title = page.title.toLowerCase();
		const description = page.description.toLowerCase();
		for (const section of page.sections) {
			const heading = section.heading.toLowerCase();
			const text = section.text.toLowerCase();
			let score = 0;
			let matched = 0;
			for (const term of terms) {
				const s =
					(title.includes(term) ? 6 : 0) +
					(heading.includes(term) ? 5 : 0) +
					(description.includes(term) ? 2 : 0) +
					count(text, term);
				if (s) matched++;
				score += s;
			}
			if (!matched) continue;
			score *= matched / terms.length;
			if (terms.length > 1 && (heading.includes(phrase) || text.includes(phrase))) score += 8;
			hits.push({ page, section, score });
		}
	}

	return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** A short excerpt around the first query term found, on one line. */
export function snippet(text: string, query: string, length = 280) {
	const flat = text.replace(/```[\s\S]*?```/g, ' [code] ').replace(/\s+/g, ' ').trim();
	const lower = flat.toLowerCase();
	const at = Math.min(...tokenize(query).map((t) => lower.indexOf(t)).filter((i) => i >= 0), flat.length);
	const start = at === flat.length ? 0 : Math.max(0, at - 80);
	const excerpt = flat.slice(start, start + length);
	return `${start > 0 ? '…' : ''}${excerpt}${start + length < flat.length ? '…' : ''}`;
}

/** Accepts "routing/controllers", "/routing/controllers/", a full URL, with or without ".md" or "#anchor". */
export function findPage(pages: Page[], input: string) {
	const path = input
		.trim()
		.replace(/^https?:\/\/[^/]+/, '')
		.replace(/[#?].*$/, '')
		.replace(/\.md$/, '')
		.replace(/^\/+|\/+$/g, '');
	return pages.find((page) => page.path === path);
}
