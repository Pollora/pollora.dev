---
title: Pollora is in public beta
description: WordPress running inside a Laravel application, with hooks, post types and REST routes declared as PHP attributes. The first public beta is out, and its version number now follows Laravel's.
date: 2026-09-17
category: announcement
version: 13.32.0-beta
---

Many Laravel developers also ship WordPress sites. When they do, they leave their routes, their container and their Blade views behind, and find `functions.php`, scattered `add_action()` calls and global functions again. Pollora exists so they don't have to choose. Today, its first public beta is available to everyone.

## WordPress inside Laravel, not the other way round

Most bridges between the two run Laravel inside WordPress. Pollora takes the inverse route: Laravel's front controller receives the request, and WordPress core loads during the boot of a service provider. The consequences are concrete:

- the front end is rendered by Laravel routing, controllers and Blade;
- the WordPress admin, database, block editor, plugins and REST API keep working as they always have;
- everything Laravel offers, from the container to queues and Eloquent, is available in a theme or a plugin.

A Laravel route can answer a WordPress page by its conditional tag, with the template hierarchy as a fallback:

```php title="routes/web.php"
use Illuminate\Support\Facades\Route;

Route::wp('single', function () {
    return view('post');
});
```

## Registration code becomes attributes

The part of a WordPress codebase that grows fastest is registration: `register_post_type()`, `add_action()`, `register_rest_route()`. In Pollora, a class says what it is, and auto-discovery registers it. There is nothing to wire by hand.

```php title="app/Cms/PostTypes/Book.php"
use Pollora\Attributes\PostType;
use Pollora\Attributes\PostType\HasArchive;
use Pollora\Attributes\PostType\ShowInRest;
use Pollora\Attributes\PostType\Supports;

#[PostType('book')]
#[HasArchive('books')]
#[Supports(['title', 'editor', 'thumbnail'])]
#[ShowInRest]
class Book
{
}
```

Hooks work the same way: a method carrying `#[Action]` or `#[Filter]` is registered with WordPress, on an instance resolved from the container, so its constructor receives its dependencies.

```php title="app/Cms/Hooks/Seo.php"
use Pollora\Attributes\Action;
use Pollora\Attributes\Filter;

class Seo
{
    #[Action('wp_head', priority: 1)]
    public function metaDescription(): void
    {
        if (is_singular()) {
            echo '<meta name="description" content="'.esc_attr(get_the_excerpt()).'">';
        }
    }

    #[Filter('body_class')]
    public function bodyClass(array $classes): array
    {
        $classes[] = 'has-js';

        return $classes;
    }
}
```

## What is in this beta

Beyond the core, this release brings a few things worth naming:

- **The WordPress Abilities API**, through the new `pollora/abilities` package: declare an ability with a fluent facade or an `#[Ability]` class, and AI clients see what it reads, creates or deletes.
- **`#[Ajax]`**, for admin-ajax actions that check their nonce and capability by default.
- **`#[SkipDiscovery]`** and a publishable `config/discovery.php`, to keep a class or a vendor folder out of discovery.
- **`pollora_register()`**, which turns a theme's `functions.php` into three lines.
- **Smaller packages**: hooks, options and Ajax now live in `pollora/hook`, `pollora/option` and `pollora/ajax`, usable outside the framework.

## Why 13.32?

The previous framework tag was v13.4.3. From this release on, Pollora's version number **follows the Laravel release it is built on**: 13.32 means Laravel 13.32. One number tells you which Laravel documentation applies to your project, and the skeleton is tagged with the same number as the framework it ships.

## Try it

You need PHP 8.4, Composer 2 and a MySQL or MariaDB database.

```bash
composer global require pollora/cli
pollora new example-app
```

`composer create-project pollora/pollora example-app` works too. The [installation guide](/getting-started/installation/) covers both, and [Why Pollora](/why/) explains where it fits next to Acorn, Sage and plain WordPress.

> **It is a beta.** APIs can still move before the first stable release, and the changelog says so whenever they do. If something breaks, an issue on [GitHub](https://github.com/Pollora/framework/issues) helps more than anything else.
