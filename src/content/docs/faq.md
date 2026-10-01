---
title: Pollora FAQ
description: "Answers about Pollora: requirements, license, plugins like WooCommerce and ACF, hosting, Gutenberg, headless use, multisite, versions and getting help."
---

## What is Pollora?

Pollora is an open-source PHP framework that runs WordPress inside a Laravel application. Laravel boots first; WordPress keeps its admin, database, plugins and REST API, and the front end is rendered with Laravel routing, controllers and Blade. Hooks, post types, taxonomies and REST routes are declared with PHP 8 attributes and registered automatically. See [Why Pollora](/why/) for the reasoning.

## What are the requirements?

A new project needs PHP 8.4 or higher, Composer 2, MySQL 5.7+ or MariaDB 10.3+, and Node.js for theme assets. The current release is built on Laravel 13.34 and installs WordPress 7.1 or later. PHP 8.4 is required because the skeleton's `composer.lock` ships Symfony 8; the framework package alone accepts PHP 8.3. DDEV is optional, and `pollora new example-app --ddev` sets up a complete local environment (see [Installation](/getting-started/installation/)).

## Is Pollora free?

Yes. The framework (`pollora/framework`), the project skeleton (`pollora/pollora`) and the CLI (`pollora/cli`) are released under the MIT license. Nectar, the optional AI tooling package, is licensed GPL-2.0-or-later. There is no paid edition.

## Is Pollora production ready?

Yes, the current release, v13.34.0, is a stable release, and `composer create-project pollora/pollora` installs it. Pollora has gone through several major versions: Nectar ships upgrade prompts from Pollora 12 to 13. Its community is still small compared with older WordPress tooling, which is worth weighing for long-lived projects.

## How do Pollora version numbers work?

Pollora's version follows the Laravel release it is built on, so 13.34 means Laravel 13.34. The skeleton and the framework are tagged together, and a skeleton tag pins the framework tag of the same number in its `composer.lock`, so one version number describes an install completely. `pollora new` installs the latest release including pre-releases; pass `--stable` or `--ver=13.34.0` to control that.

## Do existing WordPress plugins work, such as WooCommerce or ACF?

Plugins run as they do in WordPress, because Pollora loads WordPress normally. WooCommerce has explicit support: its conditional tags (`is_shop`, `is_product`, `is_cart`…) are available as [`Route::wp()` conditions](/routing/wordpress-routes/), Pollora fires Laravel events for some WooCommerce actions, and the E-commerce theme template (`pollora/theme-apiary`) is a WooCommerce storefront. For ACF, Pollora's `<InnerBlocks />` tag follows ACF's, which eases moving ACF blocks to [Pollora blocks](/blocks/gutenberg-blocks/). Plugins are installed with Composer: by default `DISALLOW_FILE_MODS` prevents installing them from the admin. To write your own, see [Plugin Development](/advanced/plugins/).

## What does a server need to host Pollora?

A server that runs PHP 8.4 with a MySQL or MariaDB database, and lets you point the document root at the project's `public/` directory. Pollora uses a Bedrock-style layout (WordPress core in `public/cms`, `wp-content` in `public/content`), so the Apache or Nginx rules differ slightly from a standard WordPress install. Behind a reverse proxy, setting `APP_URL` to an `https://` URL is enough for HTTPS. The details are in [Server Configuration](/getting-started/server-configuration/).

## Can I use Pollora on an existing WordPress site?

There is no migration guide for existing sites yet. A Pollora project is a new Laravel application with its own layout, so moving a site means moving its database, uploads and plugins into that project, then rewriting the theme as a Pollora theme. Content stays in the standard WordPress tables, and the plugins themselves do not need changes.

## I use Sage or Acorn. What carries over?

Blade templates, Tailwind CSS and Vite carry over most directly. Pollora's Blade layer includes Sage Directives (`@posts`, `@title`, `@content`), and its theme builds use `@roots/vite-plugin` to generate `theme.json` (see [Theme Structure](/theming/theme-structure/)). Hooks and post types move from WordPress function calls to attribute classes. The [comparison page](/compare/) explains the architectural differences.

## Does Pollora support Gutenberg blocks?

Yes. Custom blocks are scaffolded with `php artisan pollora:make:block`, written in JSX or TSX, built with Vite and rendered on the server with Blade; they can live in a theme, a plugin or a module (see [Gutenberg Blocks](/blocks/gutenberg-blocks/)). Block patterns are supported too, and a theme can be a Full Site Editing block theme, as the Magazine template (`pollora/theme-buzz`) is.

## Can I use Pollora headless or as an API?

Yes, through APIs that are already there. The WordPress REST API keeps working, `#[WpRestRoute]` declares custom WordPress REST endpoints with permission classes (see [REST API](/advanced/rest-api/)), and Laravel API routes are available as in any Laravel app. There is no dedicated headless guide in the documentation.

## Does Pollora support WordPress multisite?

Multisite is configured with the usual WordPress constants, set through `config/wordpress.php` and `.env` (`WP_ALLOW_MULTISITE`, `MULTISITE`), as described in [Configuration](/getting-started/configuration/#multisite-configuration). Pollora also fires Laravel events for multisite blog actions. There is no multisite-specific guide beyond that.

## Does Pollora work with AI coding agents?

Yes, through [Nectar](/nectar/overview/), a development-only package built on Laravel Boost. It adds Pollora guidelines to the agent's context, 9 on-demand agent skills (post types, hooks, blocks, theming…) and an MCP server with 10 tools that inspect the running site: registered hooks, post types, routes, plugins and more. It works with agents such as Claude Code and Cursor.

## Who maintains Pollora, and where do I get help?

Pollora is maintained by [AmphiBee](https://amphibee.fr), a French web agency, backed by RuBee. Report bugs in the [framework's GitHub issues](https://github.com/Pollora/framework/issues) and ask questions in the [discussions of the Pollora/pollora repository](https://github.com/Pollora/pollora/discussions). The source of every package is on [GitHub](https://github.com/Pollora).
