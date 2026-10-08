import type { APIRoute, GetStaticPaths } from 'astro';
import { authors, categories, getPosts, type Category } from '../../lib/blog';
import { getDocs, sections } from '../../lib/docs';
import { renderOg, type OgCard } from '../../lib/og';

/** One social preview per page; layouts point og:image at it with ogImageFor(). */
export const getStaticPaths = (async () => {
	const cards: Record<string, OgCard> = {
		index: { kicker: 'Laravel meets WordPress', title: 'The Laravel framework for WordPress' },
		features: { kicker: 'Features', title: 'Laravel, all the way into WordPress' },
		blog: { kicker: 'Blog', title: 'News from the hive' },
		changelog: { kicker: 'Changelog', title: 'Every Pollora release, newest first' },
		press: { kicker: 'Press kit', title: 'Logos, screenshots and facts about Pollora' },
	};
	for (const c of Object.keys(categories) as Category[]) {
		cards[`blog/category/${c}`] = { kicker: 'Blog', title: categories[c].plural };
	}
	for (const [name, author] of Object.entries(authors)) {
		cards[`blog/authors/${author.slug}`] = { kicker: 'Blog author', title: name };
	}
	for (const post of await getPosts()) {
		cards[`blog/${post.id}`] = {
			kicker: categories[post.data.category].label,
			tag: post.data.version && `v${post.data.version}`,
			title: post.data.title,
		};
	}
	for (const entry of await getDocs()) {
		const section = sections[entry.id.split('/')[0]];
		cards[entry.id] = { kicker: section ? `Docs · ${section}` : 'Pollora', title: entry.data.title };
	}
	return Object.entries(cards).map(([slug, card]) => ({ params: { slug }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: OgCard }> = async ({ props: { card } }) =>
	new Response(new Uint8Array(await renderOg(card)), { headers: { 'Content-Type': 'image/png' } });
