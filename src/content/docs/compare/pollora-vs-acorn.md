---
title: Pollora vs Acorn
description: "Pollora or Roots Acorn for Laravel and WordPress: who boots first, routing, post types and hooks, tooling and maturity, and when Acorn is the better choice."
---

**Short answer:** pick **Acorn** if you already have a WordPress site, theme or plugin and want Laravel's components in it. Pick **Pollora** if you are starting a project and want it to be a Laravel application that runs WordPress inside it.

Both put Laravel's container, routing, Blade and Eloquent next to WordPress, and both are MIT-licensed. They differ in which of the two is in charge of the request. This page goes deeper than the [four-way comparison](/compare/); for Sage, Radicle and Corcel, start there.

## The one real difference: who boots first

**Acorn: WordPress boots first.** WordPress handles the request, and your theme or plugin starts Acorn from a hook. The [Acorn docs](https://roots.io/acorn/docs/installation/) describe it as "a way to gracefully load a Laravel application container inside of WordPress while respecting the WordPress lifecycle and template hierarchy":

```php
// functions.php of a theme (Sage and Radicle already do this for you)
use Roots\Acorn\Application;

add_action('after_setup_theme', function () {
    Application::configure()
        ->withProviders([App\Providers\ThemeServiceProvider::class])
        ->withRouting(web: base_path('routes/web.php'))
        ->boot();
}, 0);
```

**Pollora: Laravel boots first.** `public/index.php` is Laravel's front controller. WordPress is loaded inside the application to provide the admin, the database, the plugins and the REST API, and a request goes through Laravel's router before WordPress's template hierarchy (see [How Pollora runs WordPress inside Laravel](/guides/how-pollora-runs-wordpress-inside-laravel/)).

Everything else on this page follows from that choice.

## The same task, both ways

A custom post type, a WordPress hook, and a route.

**With Acorn**, the usual way is WordPress's own functions, called from a service provider. The Roots team also publishes [`roots/acorn-post-types`](https://github.com/roots/acorn-post-types), which declares post types and taxonomies in a `config/post-types.php` file.

```php
// app/Providers/ThemeServiceProvider.php
public function boot(): void
{
    add_action('init', function () {
        register_post_type('event', [
            'label' => 'Events',
            'public' => true,
            'has_archive' => true,
            'supports' => ['title', 'editor', 'thumbnail'],
        ]);
    });
}
```

```php
// routes/web.php
Route::view('/welcome/', 'welcome')->name('welcome');
```

**With Pollora**, the post type and the hook are classes with attributes, [discovered automatically](/core-concepts/auto-discovery/):

```php
#[PostType]
#[HasArchive]
#[Supports(['title', 'editor', 'thumbnail'])]
class Event {}
```

```php
class Seo
{
    #[Action('init', priority: 20)]
    public function handleInit(): void
    {
        // runs on the WordPress init action
    }
}
```

```php
// routes/web.php: a Laravel route, matched on a WordPress conditional tag
Route::wp('single', fn () => view('post'));
```

The Pollora version has less to register by hand. The Acorn version is plain WordPress code that any WordPress developer reads at once, and it needs no convention to learn. Which of the two is better depends on your team.

## Side by side

| | Pollora | Acorn |
|---|---|---|
| **What it is** | A framework: a Laravel application that runs WordPress | A package that loads Laravel components inside WordPress |
| **Install** | `pollora new example-app` or `composer create-project pollora/pollora`: a new project | `composer require roots/acorn` in an existing theme or plugin |
| **Existing WordPress site** | No migration guide yet: the site's database, uploads and plugins move into a new Pollora project, and the theme is rewritten | Added to the site as it is |
| **Routing** | Laravel routes first, `Route::wp()` on WordPress conditional tags, then the template hierarchy as fallback | Laravel routes from `routes/web.php`, enabled with `withRouting()`; the docs recommend `wp acorn route:cache` when you deploy |
| **Controllers and middleware** | Yes ([controllers](/routing/controllers/), [middleware](/routing/middleware/)) | Yes ([documented](https://roots.io/acorn/docs/controllers-middleware-kernel/)) |
| **Post types, hooks, REST routes** | Attributes: `#[PostType]`, `#[Taxonomy]`, `#[Action]`, `#[Filter]`, `#[WpRestRoute]`, `#[Schedule]`, `#[WpCli]` | WordPress functions in your code; post types and user roles also have Roots packages (`acorn-post-types`, `acorn-user-roles`) |
| **Eloquent and WordPress data** | Models for WordPress posts, terms and users ship with Pollora | Eloquent is available; the docs show models you write for the WordPress tables |
| **Queues and migrations** | Laravel's own, plus queued listeners on WordPress events | Documented: queue tables, jobs and migrations through `wp acorn` |
| **Command line** | `php artisan` (`pollora:make:post-type`, `pollora:make:block`…); WP-CLI commands declared with `#[WpCli]` | `wp acorn` runs Artisan commands through WP-CLI; custom commands become WP-CLI commands |
| **Blocks** | `pollora:make:block`, written in JSX and rendered with Blade | Blade views as `render_callback`s, or a `block.json` `render` file (see the [Acorn docs](https://roots.io/acorn/docs/rendering-blade-views/)) |
| **Media storage** | Any Laravel disk with two settings ([Media](/advanced/media/)) | WordPress's own uploads |
| **WordPress Abilities API** | [`pollora/abilities`](/advanced/abilities/) | [`roots/acorn-ai`](https://github.com/roots/acorn-ai) |
| **License** | MIT | MIT |

## Maturity: where Acorn is far ahead

Figures read on 6 November 2026:

| | Pollora (`pollora/framework`) | Acorn |
|---|---|---|
| **Packagist installs** | about 10,400 | about 2.82 million |
| **GitHub stars** | 30 | 1,010 |
| **Latest release** | v13.40.2 | v6.3.0 |
| **Built on** | Laravel 13.40 | Laravel 13 (`illuminate/*` `^13.0`) |

Acorn is the established project. It is maintained by the Roots team, which has worked on modern WordPress development since 2011. Sage and Radicle both run on it, it has a documentation site, a forum, and a list of [community packages](https://roots.io/acorn/docs/available-packages/) (WooCommerce, ACF, mail, caching). Pollora is a young project maintained by [AmphiBee](https://amphibee.fr): it has a much smaller community, fewer third-party tutorials, and fewer people who have already hit and solved your problem.

## Choose Acorn if

- you have a **WordPress site, theme or plugin that already exists** and you do not want to move it;
- you want **Sage** (or Radicle) and its documented, widely used starting point;
- your team prefers **plain WordPress functions** for hooks and post types;
- you want the project with the **larger community**, more packages and a longer track record;
- WordPress should stay in charge of the request, which is what Acorn is built for.

## Choose Pollora if

- you are **starting a new project** and want it to be a Laravel application, with WordPress as its CMS;
- you want **Laravel to own routing**, middleware and the request lifecycle, and `Route::wp()` to reach WordPress pages from it;
- you want hooks, post types, taxonomies, REST routes and schedules **declared as attributes** and registered automatically;
- you want WordPress **media on S3, R2 or another Laravel disk**, or [Nectar](/nectar/overview/) for coding agents.

## Coming from Acorn

There is no dedicated migration guide yet. What carries over directly:

- **Blade templates**, since both build on Laravel's view layer;
- **Tailwind CSS and Vite**, and Sage Directives such as `@posts`, `@title` and `@content`;
- **Controllers, middleware, jobs and migrations**, which are Laravel code in both.

What changes: Laravel becomes the entry point instead of `functions.php`, `wp acorn` becomes `php artisan`, and hooks and post types move from function calls to attribute classes. Pollora is a new project: your content stays in the standard WordPress tables, and the plugins do not need changes.

## Sources

Acorn: the [Acorn documentation](https://roots.io/acorn/docs/installation/), the [`roots/acorn`](https://github.com/roots/acorn) repository and its `composer.json` (v6.3.0), and [Packagist](https://packagist.org/packages/roots/acorn). Pollora: this documentation, Packagist and the [Pollora repositories](https://github.com/Pollora). All read on 6 November 2026. If something here is out of date, [open an issue](https://github.com/Pollora/pollora.dev/issues) and we will correct it.

## Next steps

- [Install Pollora](/getting-started/installation/) with `pollora new example-app`.
- Read the [four-way comparison](/compare/) for Sage, Radicle and Corcel, and [Why Pollora](/why/) for the trade-offs.
- Not sure Laravel and WordPress should meet at all? See [every way to combine them](/guides/laravel-and-wordpress-approaches/).
