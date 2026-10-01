---
title: Pollora vs Acorn, Sage, Radicle and Corcel
description: "How Pollora relates to Roots Acorn, Sage, Radicle and to Corcel: architecture, routing, templating, hooks, ORM and license, to pick the right tool."
---

**Short answer:** pick **Sage** for a modern theme on an ordinary WordPress site, **Acorn** to bring Laravel components into an existing WordPress install, **Radicle** for the Roots stack prepackaged as a ready-made project, and **Corcel** when a Laravel app only needs to read WordPress data. Pick **Pollora** for the opposite arrangement: a Laravel application that boots first and runs WordPress inside it, with hooks, post types and REST routes declared as PHP attributes.

## Built on what Roots started

Roots has shaped modern WordPress development for over a decade, and it is a real source of inspiration for Pollora. Bedrock showed that WordPress belongs in a Composer-managed project, Sage brought Blade and a modern build to themes, and Acorn proved that Laravel and WordPress can share a codebase. Pollora builds on that work directly:

- themes, blocks and plugins are built with **`@roots/vite-plugin`** (WordPress dependency extraction and `theme.json` generation);
- the framework uses **`roots/bedrock-autoloader`**, and the project follows a Bedrock-style layout;
- the Blade layer ships **Sage Directives** (`@posts`, `@title`, `@content`, from `log1x/sage-directives`).

Pollora's own WordPress models are built on **`pollora/colt`, a fork of Corcel**. The projects on this page are not rivals so much as different answers to the same question. This page says where each one fits.

## At a glance

| | Pollora | Acorn | Sage | Radicle | Corcel |
|---|---|---|---|---|---|
| **What it is** | A framework: a Laravel application that runs WordPress | A package that brings Laravel components into WordPress | A WordPress starter theme | A WordPress starter combining the Roots stack (Acorn, Bedrock, Sage, optional Trellis) | Eloquent models over the WordPress database |
| **Architecture** | Laravel boots first; WordPress (admin, database, plugins, REST API) runs inside the Laravel app | WordPress boots first; Acorn is booted from a theme's `functions.php` or a plugin | A theme loaded by WordPress, using Acorn | WordPress first, with Acorn, in a Bedrock layout | Your Laravel (or other PHP) app reads the WordPress tables; WordPress is not booted |
| **Routing** | Laravel routes, `Route::wp()` on WordPress conditional tags, then the template hierarchy as fallback | Laravel routes alongside WordPress | WordPress template hierarchy, rendered with Blade | Laravel routes, through Acorn | Your application's own routes |
| **Templating** | Blade themes with Sage Directives, Vite and Tailwind CSS; block themes also supported | Blade | Blade, Tailwind CSS, Vite | Blade, through Sage | Your own front end |
| **Post types and hooks** | PHP 8 attributes (`#[PostType]`, `#[Taxonomy]`, `#[Action]`, `#[Filter]`, `#[WpRestRoute]`, `#[Schedule]`…), auto-discovered | Your theme or plugin code | Your theme code | Post types and taxonomies in `config/post-types.php` | Read access to existing data |
| **Blocks** | `pollora:make:block`, rendered with Blade | Your build | Your build | `make:block`, server-side rendering | n/a |
| **Testing** | Laravel's testing tools | Laravel's testing tools | Your setup | Pest, Playwright, linting in GitHub Actions | Your app's tests |
| **AI tooling** | [Nectar](/nectar/overview/): guidelines, 9 agent skills and 10 MCP tools, on Laravel Boost | | | | |
| **License and price** | MIT, free | MIT, free | MIT, free | One-time purchase: $80 for one site, $240 for unlimited sites | MIT, free |
| **Maturity** (October 2026) | v13.34.0 stable, a young project | v6.3.0, about 2.66M Packagist installs | v11.2.1, about 13.3k GitHub stars | Commercial product from Roots | v9.0.0, about 4.8k GitHub stars |

Sources: each project's GitHub repository, Packagist and product page (roots.io/acorn, roots.io/radicle), checked on 1 October 2026.

## Pollora and Acorn

**Choose Acorn if** you already have a WordPress site, theme or plugin and want Laravel's container, Blade, Eloquent, queues, migrations and commands without changing how the site is structured. Acorn is installed with `composer require roots/acorn` and booted from your theme or plugin, so WordPress stays in charge of the request. It is mature, maintained by the Roots team, widely used, and its WP-CLI integration (`wp acorn`) fits existing WordPress workflows.

**Pollora takes the inverse route.** The project *is* a Laravel application: `public/index.php` is Laravel's front controller, `routes/web.php` is checked first, and WordPress is loaded inside it to serve the admin, the database and the plugins. Registration code becomes attributes that are [discovered automatically](/core-concepts/auto-discovery/): a class with `#[PostType]` becomes a post type, a method with `#[Action('init')]` becomes an action. `Route::wp()` lets a Laravel route match a WordPress conditional tag such as `is_singular` (see [WordPress Routes](/routing/wordpress-routes/)).

Acorn slots into any WordPress site; Pollora is a project layout you start from.

## Pollora and Sage

**Choose Sage if** you are building a theme for a standard WordPress install and want Blade, Tailwind CSS and a Vite build with hot reloading. Sage is the most popular project on this page and the reference for modern WordPress themes.

**Pollora is an application framework rather than a theme.** Pollora themes use the same ingredients, Blade, Vite, Tailwind CSS and Sage Directives (see [Theme Structure](/theming/theme-structure/)), but they sit inside a Laravel app that also owns routing, controllers, middleware, queues, and the post types, hooks and REST routes declared as attributes.

If you only need a theme, Sage is the simpler choice.

## Pollora and Radicle

Radicle is the closest project to Pollora: a complete, Laravel-powered WordPress starter from the Roots team.

**Choose Radicle if** you want the Roots stack prepackaged, with Bedrock's structure, Acorn, Sage, optional Trellis for servers, and the tooling already wired: Pest, Playwright end-to-end tests, linting in GitHub Actions, and block scaffolding with `make:block`. It is a one-off purchase that also supports the Roots team's work.

**Pollora covers the same ground and goes further in a few places:**

- **Laravel first.** WordPress runs inside the Laravel application instead of Laravel running inside WordPress, so routing, middleware and the request lifecycle are Laravel's.
- **Attributes and auto-discovery** for post types, taxonomies, hooks, REST routes, WP-CLI commands, schedules, AJAX handlers and abilities, where Radicle registers post types and taxonomies in a configuration file.
- **`Route::wp()`**: Laravel routes matched on WordPress conditional tags, with the template hierarchy as a fallback.
- **AI tooling**: [Nectar](/nectar/overview/) gives coding agents guidelines, skills and MCP tools for the project.
- **Free and MIT-licensed.**

Both use a Bedrock-style layout (in Pollora, WordPress core in `public/cms` and `wp-content` in `public/content`; see [Server Configuration](/getting-started/server-configuration/)) and install WordPress core and plugins with Composer.

## Pollora and Corcel

**Choose Corcel if** your main application is a Laravel (or other PHP) app and WordPress is only a back office: Corcel gives you Eloquent models over the WordPress tables, so you can read posts, pages, terms, users and meta from your app. It is MIT-licensed and widely used.

**Pollora runs WordPress itself.** Hooks fire, plugins load, the admin and the REST API work, and the front end can still rely on the template hierarchy. Pollora's WordPress models (`Pollora\Models\Post`, `Page`, `Attachment`, `Term`, `User`, `Menu`…) are built on `pollora/colt`, a fork of Corcel, so Corcel-style queries remain available inside a Pollora app.

## Coming from Sage or Acorn

There is no dedicated migration guide yet. What carries over directly:

- **Blade templates**, including Sage Directives such as `@posts`, `@title` and `@content`.
- **Tailwind CSS and Vite**, with `@roots/vite-plugin` generating `theme.json` from your `@theme` design tokens (see [Theme Structure](/theming/theme-structure/)).
- **A Bedrock-style, Composer-managed project**: WordPress core and plugins are Composer dependencies.
- **ACF-style inner blocks**: Pollora's `<InnerBlocks />` tag follows ACF's, only the default wrapper class differs (see [Gutenberg Blocks](/blocks/gutenberg-blocks/)).

What changes: hooks and post types move from function calls or configuration to attribute classes, and the project becomes a Laravel application with WordPress inside it.

## Next steps

- [Install Pollora](/getting-started/installation/) with `pollora new example-app`.
- Read [Why Pollora](/why/) for the reasoning and the trade-offs.
- Check the [FAQ](/faq/) for requirements, hosting and plugins.
