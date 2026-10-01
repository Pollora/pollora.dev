---
title: "Laravel and WordPress: every way to combine them (2026)"
description: "Five ways to use Laravel with WordPress: headless, Corcel, Acorn and Sage, Pollora, or two apps. What each keeps, what it costs, and when to pick it."
sidebar:
  order: 4
---

Teams reach for Laravel and WordPress together for a common reason: editors want the WordPress admin, developers want Laravel's routing, Blade, Eloquent, queues and tests. There are several ways to combine them, and they differ in one main question: which of the two is in charge of the request.

This guide covers five approaches, what each keeps and loses, and when it is the right choice. Pollora, which this site documents, is one of them. It is not the best answer for every project.

## 1. Headless WordPress with a Laravel front end

**How it works.** WordPress runs on its own and only manages content. The Laravel application fetches that content over HTTP and renders every public page. The data comes from the [WordPress REST API](https://developer.wordpress.org/rest-api/), which is part of core and returns JSON, or from [WPGraphQL](https://www.wpgraphql.com/), a free, open-source plugin that adds a GraphQL API.

**What you keep.** The full admin and block editor for editors. Plugins that work on data and in the admin (custom fields, workflows, user management) keep working. Laravel owns the front end completely, and the same API can feed other clients, such as a mobile app.

**What you lose or rebuild.**

- Anything a plugin prints through the theme (head tags, front-end scripts, forms, widgets) does not reach your pages. You rebuild it or fetch it. Some plugins help: Yoast SEO adds `yoast_head` and `yoast_head_json` fields to REST responses and a `/wp-json/yoast/v1/get_head` endpoint for headless sites.
- Previews. The editor's preview button points to the WordPress front end. Drafts and private content are only available through the API with authentication, so a preview flow in Laravel is something you build.
- Caching runs on two layers: WordPress responses and Laravel pages. When content changes, your Laravel cache needs to know. For GraphQL, WPGraphQL offers a Smart Cache extension for this.

**Complexity.** High. Two applications, two deployments, and an API contract between them.

**Pick it when** the front end is a product in its own right, several clients consume the same content, or separate teams own the CMS and the front end.

## 2. Corcel: Laravel reads the WordPress database

**How it works.** [Corcel](https://github.com/corcel/corcel) is "a collection of Model classes that allows you to get data directly from a WordPress database". You add a database connection to the WordPress tables, and query posts, pages, custom post types, meta, taxonomies, menus, users and options as Eloquent models. ACF fields are available through the separate `corcel/acf` package, and Corcel can authenticate Laravel users against WordPress users. WordPress itself still runs separately for the admin.

**What you keep.** Fast, direct reads with Eloquent, no HTTP round trip, and a familiar Laravel codebase.

**What you lose.** WordPress does not run when Laravel reads the data, so no hooks fire: filters that plugins apply to content, plugin front-end output and SEO plugin tags do not happen unless you reproduce them. Corcel has its own shortcode support, which you configure. Writing through Corcel also bypasses WordPress hooks, so plugins that react to a save do not see it. Previews are yours to build, as in the headless approach. Note that the version table in Corcel's README stops at Laravel 12.

**Complexity.** Low to start. It grows with every plugin behaviour you have to re-create.

**Pick it when** a Laravel application needs to read WordPress content, the content model is simple, and you do not rely on plugins to shape the output.

## 3. Acorn, Sage and Radicle: Laravel components inside WordPress

**How it works.** WordPress stays in charge. [Acorn](https://roots.io/acorn/), from the Roots team, "provides a way to gracefully load a Laravel application container inside of WordPress while respecting the WordPress lifecycle and template hierarchy". It is booted from a theme's `functions.php` or a plugin, and brings Blade, service providers, Laravel-style routes, middleware, Eloquent, queues and Artisan commands through `wp acorn`. [Sage](https://github.com/roots/sage) is a starter theme built on it with Blade and Tailwind CSS. [Bedrock](https://github.com/roots/bedrock) is a Composer-based WordPress boilerplate. [Radicle](https://roots.io/radicle/) is a complete starter, sold as a one-time purchase ($80 for one site, $240 unlimited), that packages Acorn, Bedrock and Sage with a Laravel-style folder structure, Laravel routes, block scaffolding and a testing setup.

**What you keep.** Everything WordPress does. The site is a WordPress site with a more capable theme, so plugins, the admin, previews, SEO plugins and caching plugins behave as they would on any WordPress install. The Roots stack is widely used, well documented and MIT-licensed.

**What you trade.** By design, WordPress keeps the request lifecycle and Laravel works within it: you use the Laravel components Acorn provides, through Acorn's entry points, rather than a full Laravel application that owns the request. For a WordPress-first project, that is exactly the point.

**Complexity.** Low to moderate. A WordPress developer can adopt it one piece at a time, starting with Blade templates.

**Pick it when** the project is a WordPress site first, the team knows WordPress, and you want Blade and some Laravel tooling without changing how the site is hosted and run.

## 4. Pollora: WordPress inside a Laravel application

**How it works.** The order is reversed. Laravel boots first, and WordPress runs inside the Laravel application: its admin, database, plugins and REST API keep working. Public pages are rendered with Laravel. Routes in `routes/web.php` are matched first; `Route::wp()` binds WordPress conditional tags (`single`, `page`, `archive` and so on) to controllers; when nothing matches, the WordPress template hierarchy resolves a Blade view. Post types, taxonomies, hooks, REST routes and scheduled tasks are declared with PHP 8 attributes and discovered automatically. See [WordPress routes](/routing/wordpress-routes/) and [Actions and filters](/hooks/actions-filters/).

**What you keep.** The admin, the editor and the plugins. WordPress still parses each request, so conditional tags such as `is_preview()` work, and `Route::wp()` has a `preview` condition. A theme's Blade layout calls `wp_head()`, as WordPress requires of every theme, and that is where SEO plugins print their tags. On the Laravel side you get the whole framework: controllers, middleware, Eloquent, queues, Artisan, a WordPress authentication guard and WordPress hooks as Laravel events.

**What you lose or take on.**

- A non-standard layout. Pollora uses a Bedrock-style structure where the web server's document root is `public/`, with WordPress core in `public/cms` and `wp-content` in `public/content`. Hosts built around a standard WordPress layout may not fit. See [Server configuration](/getting-started/server-configuration/).
- A newer stack: a new project needs PHP 8.4, Laravel 13 and WordPress 7.1 or later.
- Plugins that write their own drop-ins or assume WordPress's default paths, such as some page-cache plugins, are worth testing before you rely on them.
- The team needs to be comfortable with both Laravel and WordPress.

**Complexity.** Moderate. One application and one deployment, but two frameworks to understand.

**Pick it when** the project is as much an application as a website, with business logic, queues, APIs or tests, and editors still need WordPress. It is less suited to a brochure site that a WordPress theme handles well, or to hosting you cannot configure.

## 5. Two separate applications

**How it works.** WordPress runs the content site on one host (`www.example.com` or `blog.example.com`), and a Laravel application runs the product on another (`app.example.com`). Each has its own front end. Sometimes they share a database, or a login.

**What you keep.** Each tool at full strength, with no integration layer. WordPress keeps every plugin, preview and caching option; Laravel is a plain Laravel application.

**What you lose.** Shared parts are maintained twice: the design system, navigation, footer and analytics. A single sign-on between the two is your work. Sharing a database couples the Laravel code to WordPress's schema, which is the same trade-off Corcel makes.

**Complexity.** Low per application, higher for the team that keeps two codebases consistent.

**Pick it when** the marketing site and the product are clearly separate, are owned by different people, and rarely need to show each other's data.

## Decision table

| | Headless | Corcel | Acorn / Sage / Radicle | Pollora | Two apps |
|---|---|---|---|---|---|
| **In charge of the request** | Laravel (WordPress via API) | Laravel (WordPress via database) | WordPress | Laravel, with WordPress inside | Each on its own host |
| **wp-admin and editor** | Yes | Yes, separate install | Yes | Yes | Yes |
| **Plugins affect the front end** | Only through the API | No | Yes | Yes, test page-cache plugins | Yes, on the WordPress site |
| **Previews** | To build | To build | Native | Native WordPress query | Native on the WordPress site |
| **SEO plugin output** | Via API fields, if the plugin offers them | To rebuild | Native | Through `wp_head()` | Native on the WordPress site |
| **Full Laravel application** | Yes | Yes | Laravel components | Yes | Yes, separate |
| **Deployments** | Two | One or two | One | One | Two |
| **Hosting** | Any, twice | Any | Standard WordPress hosting | `public/` document root, PHP 8.4 | Any, twice |
| **Main cost** | Rebuilding front-end features | Hooks never run | Laravel as a guest | Non-standard layout, two frameworks | Duplicated shared parts |

A short version:

- **The site is WordPress, and you want nicer templates:** Acorn and Sage.
- **The front end is its own product or serves several clients:** headless.
- **A Laravel app only needs to read some WordPress content:** Corcel.
- **One application with business logic, and editors in WordPress:** Pollora.
- **A marketing site and a separate product:** two applications.

For a feature-by-feature comparison of Pollora with Acorn, Sage, Corcel and others, see [Compare](/compare/). For the reasoning behind Pollora's design, see [Why Pollora](/why/).
