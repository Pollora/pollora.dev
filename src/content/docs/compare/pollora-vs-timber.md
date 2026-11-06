---
title: Pollora vs Timber
description: "Pollora or Timber for WordPress themes: Blade or Twig, a Laravel application or a templating layer, routing, post types, and when Timber is the better choice."
---

**Short answer:** pick **Timber** if you want cleaner theme templates in a WordPress site that otherwise stays as it is: Twig instead of PHP files, installed with one Composer command. Pick **Pollora** if you want the whole application around the theme to be Laravel: routing, controllers, Blade, Eloquent, Artisan, and hooks and post types declared as PHP attributes.

Timber is not a Laravel project, and the two solve problems of a different size. People still compare them, because both answer the same question: how do I stop writing WordPress templates as PHP files full of `the_title()` and `the_loop()`? This page is for that question.

## What each one is

**Timber** is, in the words of its package description, a way to "create WordPress themes with beautiful OOP code and the Twig Template Engine". Your PHP file prepares data, a Twig file prints it. It has existed since 2013, is MIT-licensed, and is maintained by a group of contributors around [Upstatement](https://upstatement.com/timber/). Its current release is v2.5.1 (May 2026), which requires PHP 8.2 or higher.

**Pollora** is a Laravel application that runs WordPress inside it. Blade is how it renders themes, and it comes with the rest of Laravel: routing, middleware, Eloquent, queues and Artisan. See [Why Pollora](/why/).

## The same template, both ways

**With Timber**, a template file in the theme gathers the data and hands it to Twig ([source](https://timber.github.io/docs/v2/guides/context/)):

```php
// single.php
$context = Timber::context();

Timber::render('single.twig', $context);
```

```twig
{# views/single.twig #}
<article>
    <h1>{{ post.title }}</h1>
    {{ post.content }}
</article>
```

**With Pollora**, WordPress's template hierarchy is mapped to Blade views, and the loop becomes a directive (see [Blade templates in WordPress](/guides/blade-templates-wordpress/)):

```blade
{{-- resources/views/single.blade.php --}}
@extends('layouts.app')

@section('content')
    @posts
        <article>
            <h1>@title</h1>
            @content
        </article>
    @endposts
@endsection
```

For this task the two are close: both support layouts and includes, and both compile templates to cached PHP. One difference worth knowing: Blade's `{{ }}` escapes its output, while Timber's Twig does not escape `{{ post.field }}` by default, and [auto-escaping is a setting you turn on](https://timber.github.io/docs/v2/guides/escaping/). Beyond that, the difference is not the template syntax, it is everything around the template.

## Side by side

| | Pollora | Timber |
|---|---|---|
| **What it is** | A framework: a Laravel application that runs WordPress | A Composer library that adds Twig to a WordPress theme |
| **Install** | `pollora new example-app`: a new project | `composer require timber/timber`, then `Timber\Timber::init()` in `functions.php`; or `composer create-project upstatement/timber-starter-theme` |
| **Existing WordPress site** | No migration guide yet: the site moves into a new Pollora project | Added to a theme or a project as it is |
| **Who handles the request** | Laravel first, WordPress inside it | WordPress; your template files call Timber |
| **Template engine** | Blade, with Sage Directives (`@posts`, `@title`, `@content`) | Twig, from Symfony |
| **Routing** | Laravel routes, `Route::wp()` on conditional tags, template hierarchy as fallback | WordPress's template hierarchy. Timber 2 ships no routing library; its docs point to `Upstatement/routes`, `Rareloop/router` and `Brain-WP/Cortex` |
| **Data in templates** | Controllers and view composers; Eloquent models for posts, terms and users | `Timber::context()` and `Timber\Post`, `Timber\Term`, `Timber\User` objects; class maps connect your own classes to post types |
| **Post types, hooks, REST routes** | Attributes: `#[PostType]`, `#[Taxonomy]`, `#[Action]`, `#[Filter]`, `#[WpRestRoute]` | Not Timber's job: its docs cover reading and rendering them, not registering them |
| **Custom fields** | Plugins such as ACF run as in WordPress; typed meta declared as attributes | A documented ACF integration: `post.meta('field')` in Twig |
| **Gutenberg blocks** | `pollora:make:block`, written in JSX and rendered with Blade | `post.content` renders blocks out of the box; a documented recipe renders ACF blocks (ACF PRO 6 or later) with Twig templates |
| **Caching** | Laravel's | Built in: cache a whole `Timber::render()` call, with several cache modes; `wp timber clear-cache` clears it |
| **Queues, migrations, ORM** | Laravel's own | Out of scope: Timber is a templating layer |
| **Command line** | `php artisan`, and WP-CLI commands declared with `#[WpCli]` | `wp timber clear-cache` |
| **License** | MIT | MIT |

## Choose Timber if

- you want **better templates and nothing else**: no new architecture, no change to how the rest of the site works;
- you have an **existing theme or site** and want to adopt Twig page by page;
- your team **already knows Twig** (or Symfony, Craft or Drupal, which use it);
- you want **one dependency** that a standard WordPress host can run, without a Laravel application to deploy;
- you want a project with **more than ten years behind it** and its own documentation, class maps and ACF integration.

## Choose Pollora if

- you want **Laravel** to be the application: routes, controllers, middleware, queues, Eloquent and Artisan, with WordPress as the CMS;
- you prefer **Blade** and want Vite and Tailwind CSS in the theme build;
- you want hooks, post types, taxonomies, REST routes and schedules **declared as attributes** and registered automatically;
- you want WordPress media on **S3, R2 or another Laravel disk** ([Media](/advanced/media/)), or [Nectar](/nectar/overview/) for coding agents;
- you are **starting a new project**, so nothing has to be migrated.

## Coming from Timber

There is no dedicated migration guide yet, and no converter from Twig to Blade, so templates are rewritten by hand. What carries over:

- **The idea of separating data from markup**: what a Timber template file does in PHP moves to a Laravel controller or a view composer;
- **Layouts, includes and blocks**, which have Blade equivalents (`@extends`, `@include`, `@section`);
- **Your content and plugins**, which stay in the standard WordPress tables: ACF fields keep working as WordPress plugins do in Pollora.

What changes: Twig syntax becomes Blade syntax, `Timber::render()` calls become views returned by the template hierarchy or a route, and the project becomes a Laravel application with WordPress inside it.

## Sources

Timber: the [`timber/timber`](https://github.com/timber/timber) repository (its `composer.json` and `docs/` folder, release v2.5.1) and the [Timber documentation](https://timber.github.io/docs/). Pollora: this documentation and the [Pollora repositories](https://github.com/Pollora). All read on 6 November 2026. If something here is out of date or wrong, [open an issue](https://github.com/Pollora/pollora.dev/issues) and we will correct it.

## Next steps

- [Install Pollora](/getting-started/installation/) with `pollora new example-app`.
- Read [Blade templates in WordPress](/guides/blade-templates-wordpress/) to see a whole Pollora theme.
- Compare Pollora with [Acorn](/compare/pollora-vs-acorn/) and [Radicle](/compare/pollora-vs-radicle/), or read the [four-way comparison](/compare/).
