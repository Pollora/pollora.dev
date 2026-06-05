// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import starlightLlmsTxt from 'starlight-llms-txt';

// https://astro.build/config
export default defineConfig({
	site: 'https://pollora.dev',
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		starlight({
			title: 'Pollora',
			description: 'Laravel meets WordPress. Modern PHP, zero compromise.',
			plugins: [starlightLlmsTxt()],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/Pollora' },
			],
			logo: {
				src: './src/assets/pollora-logo.svg',
				replacesTitle: true,
			},
			editLink: {
				baseUrl: 'https://github.com/Pollora/pollora.dev/edit/main/',
			},
			customCss: ['./src/styles/global.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Configuration', slug: 'getting-started/configuration' },
						{ label: 'Directory Structure', slug: 'getting-started/directory-structure' },
					],
				},
				{
					label: 'Core Concepts',
					items: [
						{ label: 'Architecture', slug: 'core-concepts/architecture' },
						{ label: 'Auto-Discovery', slug: 'core-concepts/auto-discovery' },
						{ label: 'Service Providers', slug: 'core-concepts/service-providers' },
					],
				},
				{
					label: 'Routing',
					items: [
						{ label: 'WordPress Routes', slug: 'routing/wordpress-routes' },
						{ label: 'Template Hierarchy', slug: 'routing/template-hierarchy' },
						{ label: 'Controllers', slug: 'routing/controllers' },
					],
				},
				{
					label: 'Content',
					items: [
						{ label: 'Post Types', slug: 'content/post-types' },
						{ label: 'Taxonomies', slug: 'content/taxonomies' },
					],
				},
				{
					label: 'Hooks',
					items: [
						{ label: 'Actions', slug: 'hooks/actions' },
						{ label: 'Filters', slug: 'hooks/filters' },
					],
				},
				{
					label: 'Theming',
					items: [
						{ label: 'Blade Templates', slug: 'theming/blade-templates' },
						{ label: 'Assets & Vite', slug: 'theming/assets-vite' },
						{ label: 'Theme Structure', slug: 'theming/theme-structure' },
					],
				},
				{
					label: 'Blocks',
					items: [
						{ label: 'Gutenberg Blocks', slug: 'blocks/gutenberg-blocks' },
						{ label: 'Patterns', slug: 'blocks/patterns' },
					],
				},
				{
					label: 'Advanced',
					items: [
						{ label: 'REST API', slug: 'advanced/rest-api' },
						{ label: 'Scheduling', slug: 'advanced/scheduling' },
						{ label: 'Modules', slug: 'advanced/modules' },
						{ label: 'Events', slug: 'advanced/events' },
						{ label: 'Authentication', slug: 'advanced/authentication' },
					],
				},
				{
					label: 'Nectar AI',
					items: [
						{ label: 'Overview', slug: 'nectar/overview' },
						{ label: 'MCP Tools', slug: 'nectar/mcp-tools' },
						{ label: 'Agent Skills', slug: 'nectar/agent-skills' },
					],
				},
			],
		}),
	],
});
