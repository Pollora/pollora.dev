import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { findPage, loadPages, pageUrl, search, snippet } from './_docs.js';

/**
 * The Pollora docs as a remote MCP server, served at https://pollora.dev/mcp (see vercel.json).
 * Stateless Streamable HTTP: every request gets its own server, nothing is kept between calls
 * but the docs index.
 */
const instructions = [
	'Search and read the documentation of Pollora, the Laravel framework for WordPress.',
	'Use search_docs to find the sections that answer a question, then get_page for the full page when a section is not enough.',
	'Cite the pollora.dev URLs the tools return.',
].join(' ');

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] });

function createServer(request: Request) {
	const server = new McpServer({ name: 'pollora-docs', version: '1.0.0' }, { instructions });

	server.registerTool(
		'search_docs',
		{
			title: 'Search the Pollora docs',
			description:
				'Full-text search over the Pollora documentation. Returns the best matching sections with their URL and an excerpt. Use precise terms: attribute names, class names, Artisan commands, WordPress concepts.',
			inputSchema: {
				query: z.string().min(1).describe('What to look for, e.g. "Route::wp conditional tags" or "custom post type attribute"'),
				limit: z.number().int().min(1).max(10).default(5).describe('How many sections to return'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async ({ query, limit }) => {
			const hits = search(await loadPages(request), query, limit);
			if (!hits.length) return text(`No section of the Pollora docs matches "${query}". Try other terms, or list_pages to browse.`);
			return text(
				hits
					.map(({ page, section }, i) =>
						[
							`${i + 1}. ${page.title}${section.heading ? ` › ${section.heading}` : ''}`,
							`   ${pageUrl(page, section.anchor)}`,
							`   ${snippet(section.text || page.description, query)}`,
						].join('\n'),
					)
					.join('\n\n') + '\n\nRead a whole page with get_page and its path, e.g. "' + hits[0].page.path + '".',
			);
		},
	);

	server.registerTool(
		'get_page',
		{
			title: 'Read a Pollora docs page',
			description: 'Returns a Pollora documentation page as Markdown. Takes its path ("routing/controllers") or its pollora.dev URL.',
			inputSchema: {
				path: z.string().min(1).describe('Page path or URL, e.g. "routing/wordpress-routes" or "https://pollora.dev/routing/wordpress-routes/"'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async ({ path }) => {
			const page = findPage(await loadPages(request), path);
			if (!page) return { ...text(`No Pollora docs page at "${path}". Use list_pages or search_docs to find the right path.`), isError: true };
			return text(page.markdown);
		},
	);

	server.registerTool(
		'list_pages',
		{
			title: 'List the Pollora docs pages',
			description: 'Lists every page of the Pollora documentation by section, with its path and a one-line summary.',
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async () => {
			const bySection = new Map<string, string[]>();
			for (const page of await loadPages(request)) {
				const lines = bySection.get(page.section) ?? [];
				lines.push(`- ${page.title} (${page.path}): ${page.description}`);
				bySection.set(page.section, lines);
			}
			return text([...bySection].map(([section, lines]) => `## ${section}\n${lines.join('\n')}`).join('\n\n'));
		},
	);

	return server;
}

// Browser-based MCP clients call from other origins
const cors = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
	'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

async function handle(request: Request) {
	const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
	await createServer(request).connect(transport);
	const response = await transport.handleRequest(request);
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(cors)) headers.set(name, value);
	return new Response(response.body, { status: response.status, headers });
}

export const POST = handle;
export const DELETE = handle;

// A browser opening the URL gets a pointer instead of a protocol error
export function GET(request: Request) {
	if (request.headers.get('accept')?.includes('text/event-stream')) return handle(request);
	return new Response(
		'Pollora docs MCP server. Add https://pollora.dev/mcp to your AI assistant as a remote (Streamable HTTP) MCP server.\nSetup: https://pollora.dev/nectar/docs-mcp-server/\n',
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8', ...cors } },
	);
}

export const OPTIONS = () => new Response(null, { status: 204, headers: cors });
