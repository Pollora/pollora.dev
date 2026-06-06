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
				{ label: 'Getting Started', items: [{ autogenerate: { directory: 'getting-started' } }] },
				{ label: 'Core Concepts', items: [{ autogenerate: { directory: 'core-concepts' } }] },
				{ label: 'Routing', items: [{ autogenerate: { directory: 'routing' } }] },
				{ label: 'Content', items: [{ autogenerate: { directory: 'content' } }] },
				{ label: 'Hooks & Events', items: [{ autogenerate: { directory: 'hooks' } }] },
				{ label: 'Theming', items: [{ autogenerate: { directory: 'theming' } }] },
				{ label: 'Blocks', items: [{ autogenerate: { directory: 'blocks' } }] },
				{ label: 'Advanced', items: [{ autogenerate: { directory: 'advanced' } }] },
				{ label: 'Nectar AI', items: [{ autogenerate: { directory: 'nectar' } }] },
			],
		}),
	],
});
