// RSS 2.0 feed of the blog, without a dependency: titles, dates and standfirsts, linking to the posts.
import type { APIRoute } from 'astro';
import { categories, getPosts, postUrl } from '../../lib/blog';

const site = 'https://pollora.dev';

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async () => {
	const posts = await getPosts();
	const items = posts
		.map((p) => {
			const link = new URL(postUrl(p), site).href;
			return `
		<item>
			<title>${escape(p.data.title)}</title>
			<link>${link}</link>
			<guid isPermaLink="true">${link}</guid>
			<pubDate>${p.data.date.toUTCString()}</pubDate>
			<category>${categories[p.data.category].label}</category>
			<description>${escape(p.data.description)}</description>
		</item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>The Pollora blog</title>
		<link>${site}/blog/</link>
		<atom:link href="${site}/blog/rss.xml" rel="self" type="application/rss+xml" />
		<description>Releases, roadmap and tutorials for Pollora, the Laravel framework for WordPress.</description>
		<language>en</language>${posts[0] ? `\n\t\t<lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>` : ''}${items}
	</channel>
</rss>
`;

	return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
