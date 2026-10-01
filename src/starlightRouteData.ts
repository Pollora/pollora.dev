import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/**
 * Search titles, set here rather than in frontmatter. Synced docs pages keep short titles
 * for the sidebar ("Controllers") and the sync would overwrite any edit there; the other
 * entries avoid a repeated or overlong "| Pollora" suffix. Pages not listed keep "Title | Pollora".
 */
const searchTitles: Record<string, string> = {
	'getting-started/installation': 'Install Pollora, the Laravel framework for WordPress',
	'getting-started/configuration': 'Configure a Pollora project (Laravel + WordPress)',
	'getting-started/ide-setup': 'IDE setup for Pollora: PhpStorm and VS Code',
	'getting-started/environment': 'Environments in WordPress and Laravel · Pollora',
	'getting-started/server-configuration': 'Apache and Nginx setup for Pollora',
	'core-concepts/auto-discovery': 'Auto-discovery of hooks and post types · Pollora',
	'core-concepts/wordpress-config': 'WordPress constants from Laravel config · Pollora',
	'core-concepts/translations': 'Laravel and WordPress translations · Pollora',
	'routing/wordpress-routes': 'Laravel routes for WordPress with Route::wp()',
	'routing/controllers': 'Laravel controllers for WordPress pages · Pollora',
	'routing/middleware': 'Laravel middleware on WordPress routes · Pollora',
	'content/post-types': 'WordPress post types with PHP attributes · Pollora',
	'content/post-types-reference': 'Post type attributes reference · Pollora',
	'content/taxonomies': 'WordPress taxonomies with PHP attributes · Pollora',
	'content/options': 'WordPress options with a fluent API · Pollora',
	'hooks/actions-filters': 'WordPress actions and filters as attributes · Pollora',
	'hooks/events-listeners': 'WordPress hooks as Laravel events · Pollora',
	'hooks/wordpress-events-reference': 'WordPress events reference for Laravel · Pollora',
	'theming/theme-structure': 'WordPress themes with Blade and Vite · Pollora',
	'theming/assets-vite': 'Vite assets for WordPress themes · Pollora',
	'theming/menus': 'WordPress menus with rule-based classes · Pollora',
	'blocks/gutenberg-blocks': 'Gutenberg blocks with Vite, JSX and Blade · Pollora',
	'blocks/patterns': 'WordPress block patterns · Pollora',
	'advanced/rest-api': 'WordPress REST endpoints with attributes · Pollora',
	'advanced/abilities': 'WordPress Abilities API for AI agents · Pollora',
	'advanced/scheduling': 'WordPress cron tasks with PHP attributes · Pollora',
	'advanced/modules': 'Laravel Modules in a WordPress project · Pollora',
	'advanced/authentication': 'WordPress users with Laravel Auth · Pollora',
	'advanced/ajax': 'WordPress AJAX handlers with attributes · Pollora',
	'advanced/dashboard': 'Pollora dashboard and pollora:doctor diagnostics',
	'advanced/logging': 'WordPress error logging through Laravel · Pollora',
	'advanced/wp-cli': 'Custom WP-CLI commands with attributes · Pollora',
	'advanced/plugins': 'Build WordPress plugins with Laravel · Pollora',
	'nectar/overview': 'Nectar: AI context for Pollora coding agents',
	why: 'Why Pollora: WordPress inside a Laravel application',
	faq: 'Pollora FAQ: the Laravel framework for WordPress',
	compare: 'Pollora vs Acorn, Sage, Radicle and Corcel',
	changelog: 'Pollora changelog: release notes and versions',
	'guides/custom-post-types-php-attributes': 'Custom post types and taxonomies with PHP attributes',
	'guides/laravel-and-wordpress-approaches': 'Laravel and WordPress: every way to combine them',
	'guides/how-pollora-runs-wordpress-inside-laravel': 'How Pollora runs WordPress inside Laravel',
};

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const title = searchTitles[route.id];
	if (!title) return;
	const tag = route.head.find((entry) => entry.tag === 'title');
	if (tag) tag.content = title;
});
