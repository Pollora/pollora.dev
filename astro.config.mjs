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
			favicon: '/favicon.svg',
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap',
					},
				},
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
			customCss: ['./src/styles/docs.css'],
			components: {
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
					codeFontFamily: "'JetBrains Mono', ui-monospace, monospace",
					codeFontSize: '0.84rem',
					codeLineHeight: '1.7',
					uiFontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
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
