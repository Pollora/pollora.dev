---
title: Pollora vs Radicle
description: "Pollora or Roots Radicle as a Laravel-powered WordPress starter: what each gives you, tooling, price, and when Radicle is the better choice."
---

**Short answer:** pick **Radicle** if you want the Roots stack (Acorn, Bedrock, Sage, optionally Trellis) already assembled, with its testing and linting setup, from the team that built those tools. Pick **Pollora** if you want Laravel to be the application that boots first and runs WordPress inside it, with hooks, post types and REST routes declared as PHP attributes, in a project that is free and open source.

Both are starting points for a new project, not packages you add to an existing site. For that, look at [Acorn](/compare/pollora-vs-acorn/). This page goes deeper than the [four-way comparison](/compare/).

## What you start from

**Radicle** is, in its own words, "an opinionated starting point for WordPress projects with the Roots stack". The [product page](https://roots.io/radicle/) lists what it packages:

- **Acorn**, configured from the root of the project, to use Laravel inside WordPress;
- **Bedrock**, modified to use `public/` as the web root, with a Laravel-style layout (`app/`, `config/`, `resources/`, `storage/`);
- **Sage**, with theme templates in `resources/views/` and a theme directory that only holds `index.php` and `style.css`;
- **Trellis**, optional, for local development, server setup and deployment (Lando is optional too).

**Pollora** is a framework plus a project skeleton. `pollora new example-app` (or `composer create-project pollora/pollora`) creates a Laravel application; WordPress core lives in `public/cms` and `wp-content` in `public/content`. `php artisan pollora:make:theme` then starts a theme from a template: Default, E-commerce (a WooCommerce storefront) or Magazine (a block theme). See [Installation](/getting-started/installation/) and [Theme Structure](/theming/theme-structure/).

## The main difference: who handles the request

Radicle is built on Acorn, so WordPress handles the request and Laravel's components run inside it. Radicle adds Laravel routes (the product page describes them as a way to serve "virtual pages") and lists Laravel-style APIs built with Eloquent models and REST endpoints.

Pollora inverts this. `public/index.php` is Laravel's front controller, a request goes through Laravel's router first, and `Route::wp()` lets a Laravel route match a WordPress conditional tag. WordPress's template hierarchy is the fallback. The [Pollora vs Acorn](/compare/pollora-vs-acorn/#the-one-real-difference-who-boots-first) page shows the difference in code.

## Side by side

Radicle's code and documentation are available to customers only, so this column comes from its public product page.

| | Pollora | Radicle |
|---|---|---|
| **What it is** | A Laravel application that runs WordPress | A starter combining Acorn, Bedrock, Sage and optionally Trellis |
| **Who handles the request** | Laravel first, WordPress inside it | WordPress first, with Acorn inside it |
| **Project layout** | Laravel application; WordPress core in `public/cms` | Bedrock with a Laravel-style layout and `public/` as web root |
| **Routing** | Laravel routes, `Route::wp()` on conditional tags, template hierarchy as fallback | Laravel routes serving views, next to the WordPress template hierarchy |
| **Post types and taxonomies** | PHP attributes (`#[PostType]`, `#[Taxonomy]`), discovered automatically | Configuration in `config/post-types.php`, with Extended CPTs |
| **Hooks and REST routes** | Attributes (`#[Action]`, `#[Filter]`, `#[WpRestRoute]`, `#[Schedule]`, `#[WpCli]`) | Not listed on the product page |
| **Theme setup** | `pollora:make:theme` from three templates; Vite and Tailwind CSS | Configuration in `config/theme.php` (menus, sidebars, theme supports); Blade and Alpine.js starter components |
| **Blocks** | `pollora:make:block`, written in JSX and rendered with Blade | `wp acorn make:block`, with server-side rendering and Blade components |
| **Testing and CI** | Laravel's testing tools; the skeleton includes a PHPUnit setup | Pest, Playwright end-to-end tests, linting and formatting in GitHub Actions (Mago, Oxlint, Oxfmt) |
| **Server and local environment** | `pollora new --ddev` sets up DDEV | Lando config, and Trellis for local development, provisioning and deployment |
| **Mail** | Laravel's, as in any Laravel application | Acorn Mail, with mailables, notifications and queue support |
| **AI tooling** | [Nectar](/nectar/overview/) | Not listed on the product page |
| **Source and docs** | Public, MIT license | Available to customers |
| **Price** | Free | One-time purchase: $80 for one site, $240 for unlimited sites |

## Choose Radicle if

- you want **the Roots stack ready-made**, chosen and wired by the team that maintains it;
- you value a **complete testing and CI setup** from the first commit: Pest, Playwright, linting and formatting in GitHub Actions;
- you want **Trellis** to provision servers and deploy, or you already use Bedrock and Trellis;
- you prefer **configuration files** for post types, taxonomies and theme settings;
- you want a project backed by **Roots, an independent open source organization working on WordPress since 2011**. A Radicle purchase also supports their work on Acorn, Bedrock, Sage and the rest.

## Choose Pollora if

- you want **Laravel to own the request**, with controllers, middleware and `Route::wp()` reaching WordPress pages from it;
- you want hooks, post types, taxonomies, REST routes and schedules **declared as attributes** and registered automatically;
- you want **free, open source code** you can read, with every package public on [GitHub](https://github.com/Pollora);
- you want WordPress media on **S3, R2 or another Laravel disk** ([Media](/advanced/media/)), Gutenberg blocks written in JSX, or [Nectar](/nectar/overview/) for coding agents;
- you want to start from a **WooCommerce storefront** or a **block theme** template.

## Coming from Radicle

There is no dedicated migration guide yet. What carries over directly:

- **Blade templates** and Alpine.js components;
- **Tailwind CSS and Vite**;
- **Controllers, middleware, jobs and migrations**, which are Laravel code in both;
- **Composer-managed WordPress core and plugins**.

What changes: Laravel becomes the entry point, `wp acorn` becomes `php artisan`, and post types move from `config/post-types.php` to attribute classes. Your content stays in the standard WordPress tables, and the plugins do not need changes.

## Sources

Radicle: the [product page](https://roots.io/radicle/) at roots.io, and the [Acorn documentation](https://roots.io/acorn/docs/installation/) for what Acorn provides. Radicle's repository and documentation are not public, so this page claims nothing beyond what the product page states. Pollora: this documentation and the [Pollora repositories](https://github.com/Pollora). All read on 6 November 2026. If something here is out of date or wrong, [open an issue](https://github.com/Pollora/pollora.dev/issues) and we will correct it.

## Next steps

- [Install Pollora](/getting-started/installation/) with `pollora new example-app`.
- Read the [four-way comparison](/compare/), the [Pollora vs Acorn](/compare/pollora-vs-acorn/) page and [Why Pollora](/why/) for the trade-offs.
- Not sure Laravel and WordPress should meet at all? See [every way to combine them](/guides/laravel-and-wordpress-approaches/).
