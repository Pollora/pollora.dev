import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import olivierGorzalka from '../assets/authors/olivier-gorzalka.png';
import polloraAvatar from '../assets/pollora-avatar.png';

export type Post = CollectionEntry<'blog'>;
export type Category = Post['data']['category'];

export const categories: Record<Category, { label: string; plural: string; intro: string }> = {
	announcement: { label: 'Announcement', plural: 'Announcements', intro: 'News about the project itself.' },
	release: { label: 'Release', plural: 'Releases', intro: 'What each version brings, and why.' },
	tutorial: { label: 'Tutorial', plural: 'Tutorials', intro: 'Step-by-step walkthroughs of a feature, from an empty file to a working page.' },
	roadmap: { label: 'Roadmap', plural: 'Roadmap', intro: 'Features being designed, before they ship. Feedback welcome.' },
};

/** Published posts, newest first. Drafts show in `astro dev` only. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', (p) => import.meta.env.DEV || !p.data.draft);
	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export type Author = {
	slug: string;
	avatar: ImageMetadata;
	role?: string;
	bio?: string;
	links?: { label: string; href: string; kind: 'site' | 'github' | 'linkedin' }[];
	/** A line in their own words, under the bio */
	quote?: string;
	/** The principle shown in large on their page */
	motto?: string;
	timeline?: { year: string; title: string; place?: string; text: string }[];
};

/** Bylines: a post's `author` names one of these; an unknown name gets the Pollora avatar and no page. */
export const authors: Record<string, Author> = {
	'Olivier Gorzalka': {
		slug: 'olivier-gorzalka',
		avatar: olivierGorzalka,
		role: 'Creator of Pollora · President and CTO of AmphiBee',
		bio: 'Web developer since 2007: agency work on large accounts, then e-commerce, then an independent practice. Today, president and CTO of AmphiBee and founder of the RuBee group, still writing code every day, Pollora included.',
		links: [
			{ label: 'rubee.group', href: 'https://rubee.group', kind: 'site' },
			{ label: 'amphibee.fr', href: 'https://amphibee.fr', kind: 'site' },
			{ label: 'GitHub', href: 'https://github.com/ogorzalka', kind: 'github' },
			{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/oliviergorzalka/', kind: 'linkedin' },
		],
		quote: 'Nineteen years in, one thing has not changed: I still write code.',
		motto: 'Start from the problem, never from the tool.',
		timeline: [
			{ year: '2007', title: 'Cosmic Communication', place: 'Paris', text: 'The web department of a global communications agency. Three years on large accounts (Renault, BNP Paribas, Essilor), and a first lesson in long projects with many sign-offs.' },
			{ year: '2010', title: 'Terre de Café', place: 'Nord', text: 'Front-end developer, then technical project manager. Led the move to e-commerce: from delivering a site to running one, with stock, orders, payments and the occasional crisis.' },
			{ year: '2015', title: 'Independent', text: 'WordPress, WooCommerce, integration and visual identity, for agencies and direct clients. The best school for learning what to delegate.' },
			{ year: '2018', title: 'AmphiBee', text: 'Co-founds the web agency and becomes its president and technical director. Today a team of twenty: technical strategy, quality, and the people.' },
			{ year: '2022', title: 'RuBee', text: 'Creates the group that holds AmphiBee and a stake in Agence Onze, an SEO agency.' },
			{ year: 'Now', title: 'Pollora', text: 'The open-source framework that runs WordPress inside Laravel, born from years of shipping both. Alongside it, AI tooling that gives agents the context of a codebase.' },
		],
	},
};

export const authorUrl = (slug: string) => `/blog/authors/${slug}/`;

export const authorOf = (post: Post) => {
	const author = authors[post.data.author];
	return {
		name: post.data.author,
		avatar: author?.avatar ?? polloraAvatar,
		url: author ? authorUrl(author.slug) : undefined,
	};
};

export const postUrl = (post: Post) => `/blog/${post.id}/`;

export const formatDate = (date: Date) =>
	date.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Minutes to read, at 220 words a minute; code counts as words too. */
export function readingTime(post: Post): number {
	const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 220));
}
