---
title: Why Pollora
description: "Why Pollora runs WordPress inside a Laravel application: the problem with procedural hooks and globals, what you keep from WordPress, and the trade-offs."
---

WordPress is a very good CMS. Editors know the admin, the plugin ecosystem covers almost any need, and every host runs it. What it is not is a modern PHP application framework, and teams that write a lot of custom code for WordPress feel that gap every day. Pollora exists to close it without giving up what makes WordPress useful.

## The problem

Custom WordPress code is mostly procedural. Behaviour is attached with `add_action()` and `add_filter()` calls scattered across `functions.php` and plugin files, usually as global functions or closures. Post types are arrays of options passed to `register_post_type()` inside an `init` callback. The front end is a set of template files picked by the template hierarchy, each mixing queries, logic and HTML. There is no service container, no routing layer you control, no standard way to test, queue or schedule work.

Modern PHP has answers for all of this, mostly in Laravel: dependency injection, routing and middleware, Blade, Eloquent, Artisan, queues, a test setup. The question is how to get them without fighting WordPress.

## The approach

A Pollora project is a Laravel application. Laravel boots first, then loads WordPress inside it, so WordPress keeps doing its job (admin, database, plugins, REST API) while Laravel handles the front end.

**Attributes instead of registration code.** Hooks, post types, taxonomies, REST routes, scheduled tasks and AJAX handlers are declared with PHP 8 attributes on ordinary classes. Pollora's [auto-discovery](/core-concepts/auto-discovery/) finds them and registers them, with no list to maintain.

A post type, before:

```php title="functions.php"
add_action('init', function () {
    register_post_type('book', [
        'labels' => [
            'name' => __('Books'),
            'singular_name' => __('Book'),
            // ...a dozen more labels
        ],
        'publicly_queryable' => true,
        'has_archive' => true,
        'supports' => ['title', 'editor', 'thumbnail'],
        'menu_icon' => 'dashicons-book',
    ]);
});
```

And with Pollora, where the slug and every label are generated from the class name (see [Post Types](/content/post-types/)):

```php title="app/Cms/PostTypes/Book.php"
namespace App\Cms\PostTypes;

use Pollora\Attributes\PostType;
use Pollora\Attributes\PostType\HasArchive;
use Pollora\Attributes\PostType\MenuIcon;
use Pollora\Attributes\PostType\PubliclyQueryable;
use Pollora\Attributes\PostType\Supports;

#[PostType]
#[PubliclyQueryable]
#[HasArchive]
#[Supports(['title', 'editor', 'thumbnail'])]
#[MenuIcon('dashicons-book')]
class Book
{
}
```

Hooks follow the same pattern. Before:

```php title="functions.php"
add_action('init', 'mytheme_setup', 20);
function mytheme_setup() {
    // ...
}

add_filter('the_content', function ($content) {
    return str_replace('ugly', 'shiny', $content);
});
```

After, in a class that is discovered automatically (see [Actions & Filters](/hooks/actions-filters/)):

```php title="app/Cms/Hooks/ContentHooks.php"
namespace App\Cms\Hooks;

use Pollora\Attributes\Action;
use Pollora\Attributes\Filter;

class ContentHooks
{
    #[Action('init', priority: 20)]
    public function setup(): void
    {
        // ...
    }

    #[Filter('the_content')]
    public function polish(string $content): string
    {
        return str_replace('ugly', 'shiny', $content);
    }
}
```

**Routing you control.** Routes in `routes/web.php` are matched first. `Route::wp('single', ...)` matches a WordPress conditional tag and sends it to a closure or controller, with middleware and named routes like any Laravel route. Anything not routed falls back to the template hierarchy, rendered with Blade views (see [WordPress Routes](/routing/wordpress-routes/)).

**The rest of Laravel.** Blade themes built with Vite and Tailwind CSS, Eloquent (including models for WordPress posts, terms and users), Artisan, queued listeners on WordPress events, the scheduler, a WordPress authentication guard, and the skeleton's PHPUnit setup. Gutenberg blocks are written in JSX, built with Vite and rendered with Blade.

## What you keep from WordPress

- **The admin and the editors' workflow.** Editors log in to `wp-admin` and use the block editor as usual.
- **Plugins.** WordPress is loaded normally, so plugins run as they do in WordPress. They are installed with Composer, and Pollora even maps WooCommerce conditional tags to `Route::wp()` aliases.
- **The data.** Content lives in the standard WordPress tables.
- **Ordinary PHP hosting.** Any server that runs PHP 8.4 and MySQL or MariaDB, with the document root pointed at `public/` (see [Server Configuration](/getting-started/server-configuration/)).

## Trade-offs, and who it is not for

**If you only need a theme**, Pollora is more than you need. A starter theme like Sage on a standard install is simpler (see [the comparison](/compare/)).

**It is a new project layout, not a plugin.** WordPress core lives in `public/cms`, `wp-content` in `public/content`, and the web server must serve `public/`. Hosting that does not let you choose the document root or run Composer is a poor fit. By default Pollora also disables installing plugins and themes from the admin (`DISALLOW_FILE_MODS`) and WordPress core auto-updates: changes go through Composer and deployment.

**Two frameworks to keep updated.** This is the most common concern, and Pollora's versioning is designed around it. Version numbers follow the Laravel release Pollora is built on: 13.34 means Laravel 13.34. The skeleton and the framework are tagged together, and a skeleton tag pins the framework tag of the same number, so one version number describes an install. WordPress core is a Composer dependency like the rest. For major upgrades, [Nectar](/nectar/overview/) ships upgrade prompts that walk AI coding agents through the steps.

**A smaller community.** Pollora is maintained by AmphiBee and its community is much smaller than that of the Roots projects. The current release, v13.35.0, is stable, but you will find fewer third-party tutorials.

If those trade-offs work for you, [install Pollora](/getting-started/installation/) and try it, or read the [FAQ](/faq/).
