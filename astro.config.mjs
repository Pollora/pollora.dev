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
			plugins: [
				starlightLlmsTxt({
					projectName: 'Pollora',
					description: 'Pollora is the Laravel framework for WordPress: an open-source PHP framework that runs WordPress inside a Laravel application.',
					details: [
						'- The front end uses Laravel routing, controllers, Blade and Eloquent; the WordPress admin, database, editors and plugins keep working.',
						'- Hooks, post types, taxonomies, REST routes, WP-CLI commands and schedules are declared with PHP 8 attributes and registered by auto-discovery.',
						'- `Route::wp()` matches Laravel routes on WordPress conditional tags, with the template hierarchy as a fallback.',
						'- Current release: v13.35.0 (stable). Version numbers follow the Laravel release Pollora is built on.',
						'- Requirements for a new project: PHP 8.4+, Laravel 13.35, WordPress 7.1+, Composer 2.',
						'- Install: `composer global require pollora/cli` then `pollora new example-app` (or `composer create-project pollora/pollora example-app`).',
						'- License: MIT (pollora/framework, pollora/pollora, pollora/cli, and Nectar, the AI context package for coding agents).',
						'- Maintained by AmphiBee (https://amphibee.fr), © RuBee group (https://rubee.group). Source: https://github.com/Pollora',
					].join('\n'),
					promote: ['why', 'getting-started/**', 'guides/**'],
					demote: ['hooks/wordpress-events-reference', 'content/post-types-reference', 'changelog'],
					exclude: ['hooks/wordpress-events-reference', 'content/post-types-reference'],
				}),
			],
			favicon: '/favicon.svg',
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
				// Social preview: Starlight already sets twitter:card to summary_large_image
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://pollora.dev/og-image.png' } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://pollora.dev/og-image.png' } },
			],
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
			routeMiddleware: './src/starlightRouteData.ts',
			customCss: [
				'@fontsource-variable/geist',
				'@fontsource-variable/space-grotesk',
				'@fontsource-variable/jetbrains-mono',
				'./src/styles/docs.css',
			],
			components: {
				Head: './src/components/docs/Head.astro',
				SkipLink: './src/components/docs/SkipLink.astro',
				PageTitle: './src/components/docs/PageTitle.astro',
				Footer: './src/components/docs/Footer.astro',
			},
			// One dark theme in both modes, on the aubergine of the homepage code samples
			expressiveCode: {
				themes: ['dracula'],
				styleOverrides: {
					borderRadius: '10px',
					borderColor: 'oklch(27% 0.03 295)',
					codeBackground: 'oklch(17% 0.03 290)',
					codeFontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
					codeFontSize: '0.84rem',
					codeLineHeight: '1.7',
					uiFontFamily: "'Geist Variable', 'Geist', ui-sans-serif, system-ui, sans-serif",
					frames: {
						editorBackground: 'oklch(17% 0.03 290)',
						terminalBackground: 'oklch(17% 0.03 290)',
						editorTabBarBackground: 'oklch(21% 0.03 290)',
						editorActiveTabBackground: 'oklch(17% 0.03 290)',
						editorActiveTabIndicatorTopColor: '#ff5334',
						terminalTitlebarBackground: 'oklch(21% 0.03 290)',
						terminalTitlebarBorderBottomColor: 'oklch(27% 0.03 295)',
						frameBoxShadowCssValue: 'none',
						inlineButtonBorder: 'oklch(40% 0.03 295)',
					},
				},
			},
			sidebar: [
				{
					label: 'About Pollora',
					items: [
						{ label: 'Why Pollora', link: '/why/' },
						{ label: 'How Pollora compares', link: '/compare/' },
						{ label: 'FAQ', link: '/faq/' },
						{ label: 'Changelog', link: '/changelog/' },
					],
				},
				{ label: 'Getting Started', items: [{ autogenerate: { directory: 'getting-started' } }] },
				{ label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] },
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
