---
title: Blade templates in WordPress
description: "Use Laravel Blade in a WordPress theme: the template hierarchy mapped to Blade views, layouts, components, WordPress directives, view composers and blocks."
sidebar:
  order: 6
---

Blade is Laravel's template engine: layouts, sections, components and `{{ }}` output that is escaped by default. WordPress themes use plain PHP files. This guide explains how a Pollora theme uses Blade for the whole front end while keeping the WordPress template hierarchy, then builds a minimal working theme.

## Plain WordPress templates vs Blade

A classic `single.php` mixes the header, the loop and the footer in PHP tags:

```php title="single.php"
<?php get_header(); ?>
<?php while ( have_posts() ) : the_post(); ?>
    <article>
        <h1><?php the_title(); ?></h1>
        <?php the_content(); ?>
    </article>
<?php endwhile; ?>
<?php get_footer(); ?>
```

The same template in Blade extends a layout and fills a section:

```blade title="resources/views/single.blade.php"
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

The layout is written once. `{{ $value }}` escapes its output, so forgetting `esc_html()` is no longer the default failure. Views are compiled to cached PHP, and you get Blade's components, `@include`, `@foreach` and the rest of the syntax.

## How Pollora finds the Blade view

WordPress still decides which template a request needs. Pollora changes where it looks and how the result is rendered.

1. `RegisterTemplateHierarchyFiltersUseCase` (`src/View/Application/UseCases/`) hooks every `*_template_hierarchy` filter: `single`, `page`, `archive`, `category`, `taxonomy`, `404`, `index` and the rest.
2. For each candidate, `FileSystemTemplateFinder::locate()` swaps `.php` for `.blade.php` and looks for the file in the theme's view paths. Blade matches are put ahead of PHP files.
3. When no [Laravel route](/routing/wordpress-routes/) matches the request, `FrontendController` asks WordPress for the template, applies `template_include`, converts the path to a view name and renders it with `View::make()`.

The view paths of a theme are `resources/views`, `views` and the theme root, in that order (`ModuleAssetManager::getModuleViewPaths()`). In practice you put Blade files in `resources/views/`. WordPress's names map directly:

| Request | WordPress candidates | Blade view |
|---|---|---|
| Single `book` post | `single-book-{slug}.php`, `single-book.php`, `single.php` | `single-book.blade.php`, then `single.blade.php` |
| Page | `page-{slug}.php`, `page-{id}.php`, `page.php` | `page-about.blade.php`, then `page.blade.php` |
| Category | `category-{slug}.php`, `category.php`, `archive.php` | `category.blade.php`, then `archive.blade.php` |
| Not found | `404.php` | `404.blade.php` |
| Anything else | `index.php` | `index.blade.php` |

`index.blade.php` is the last resort. For a 404, if the theme has no `404.blade.php`, Pollora renders Laravel's `errors.404` view instead of the index, with a 404 status.

Custom page templates use a Blade comment instead of a PHP header. Pollora scans the view paths for it and adds the template to the editor's list (`WordPressTemplateHierarchyFilter::extendThemeTemplates()`):

```blade title="resources/views/templates/landing.blade.php"
{{-- Template Name: Landing page --}}
{{-- Template Post Type: page, post --}}
@extends('layouts.app')
```

## Layouts and components

Layouts are ordinary Blade views. WordPress's `wp_head()` and `wp_footer()` must still run, because plugins and enqueued assets depend on them:

```blade title="resources/views/layouts/app.blade.php"
<!DOCTYPE html>
<html {!! get_language_attributes() !!}>
<head>
    <meta charset="{{ get_bloginfo('charset') }}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @wphead
</head>
<body @bodyclass>
    @yield('content')
    @wpfooter
</body>
</html>
```

Components work as in Laravel. Laravel looks up anonymous components as `components.*` views through the same view finder, so a file at `resources/views/components/card.blade.php` in the theme is available as `<x-card>`.

## WordPress directives

`@posts`, `@title` and `@wphead` above are not core Blade. They come from [Sage Directives](https://github.com/Log1x/sage-directives) (`log1x/sage-directives` 2.0), which `pollora/framework` requires and registers in `PolloraServiceProvider`. Some of the WordPress ones:

- Loop: `@posts` / `@endposts` (the main query, a `WP_Query`, a post, an ID or an array of IDs), `@hasposts`, `@noposts`, `@query`.
- Post data: `@title`, `@content`, `@excerpt`, `@permalink`, `@thumbnail`, `@published`, `@modified`, `@author`, `@postmeta`.
- Users: `@user` / `@enduser`, `@guest` / `@endguest`, `@role`.
- Theme: `@wphead`, `@wpfooter`, `@bodyclass`, `@wpbodyopen`, `@menu`, `@sidebar`, `@shortcode`.
- ACF: `@field`, `@hasfield`, `@fields`, `@sub`, `@option`, and others.

A theme can add its own directives in `resources/directives.php`, which returns an array of names and compiler callbacks. Pollora loads it when the theme registers (`ModuleAssetManager::registerModuleBladeDirectives()`):

```php title="resources/directives.php"
<?php

return [
    'year' => fn (): string => '<?php echo date("Y"); ?>',
];
```

## Passing data to views

Most templates can read WordPress data directly through the directives and template tags. When a page needs real logic, there are two Laravel ways to hand data to a view.

A controller on a [WordPress route](/routing/controllers/). Type-hinted `WP_Post`, `WP_Term`, `WP_User` or `WP_Query` parameters are filled from the current query:

```php title="routes/web.php"
use Illuminate\Support\Facades\Route;

Route::wp('single', function (WP_Post $post) {
    return view('single', [
        'related' => get_posts(['post__not_in' => [$post->ID], 'numberposts' => 3]),
    ]);
});
```

A view composer, for data every page needs. The default theme (`pollora/theme-default`) builds its navigation this way in `app/Providers/MenuServiceProvider.php`:

```php title="app/Providers/MenuServiceProvider.php"
View::composer('*', function ($view) {
    if (! $view->offsetExists('menu')) {
        $view->with('menu', $this->getMenu('primary'));
    }
});
```

## Blade for blocks

Dynamic Gutenberg blocks can render with Blade too. Point `render` in `block.json` at a Blade file:

```json title="resources/views/blocks/call-to-action/block.json"
{
    "name": "default/call-to-action",
    "render": "file:./render.blade.php"
}
```

`BlockRegistrar` renders the file with Laravel's view factory and passes `$attributes`, `$content`, `$block` and `$isPreview`:

```blade title="resources/views/blocks/call-to-action/render.blade.php"
<div {!! get_block_wrapper_attributes() !!}>
    <h2>{{ $attributes['heading'] ?? '' }}</h2>
</div>
```

`php artisan pollora:make:block` generates the full set (block.json, JSX, styles, render file). See [Gutenberg blocks](/blocks/gutenberg-blocks/).

## A minimal working theme

In a Pollora project, themes live in `themes/`. This is the smallest set of files that renders posts and pages with Blade:

```plaintext
themes/minimal/
├── style.css
├── functions.php
├── index.php
├── theme.json
└── resources/views/
    ├── layouts/app.blade.php
    ├── index.blade.php
    └── single.blade.php
```

`style.css` holds the WordPress theme header, and `index.php` is an empty stub that WordPress needs to treat the folder as a theme. `theme.json` is required as well: Pollora only lists a theme as available when it has one (`ThemeMetadata::getConfigPath()`). `{"version": 2}` is enough to start.

```css title="style.css"
/*
Theme Name: Minimal
*/
```

`functions.php` hands the theme to Pollora, which registers its view paths, directives and discovered classes:

```php title="functions.php"
<?php

use Pollora\Modules\Domain\Enums\ModuleType;

pollora_register(ModuleType::Theme);
```

Use the layout above, the `single.blade.php` from the first section, and this index:

```blade title="resources/views/index.blade.php"
@extends('layouts.app')

@section('content')
    @posts
        <h2><a href="@permalink">@title</a></h2>
        @excerpt
    @endposts

    @noposts
        <p>Nothing found.</p>
    @endnoposts
@endsection
```

Activate the theme in wp-admin. For a real project, `php artisan pollora:make:theme` creates a complete theme with Vite and Tailwind CSS. The [theme structure](/theming/theme-structure/) page describes it.

## Alternatives

Pollora is not the only way to get Blade into WordPress. [Sage](https://github.com/roots/sage), from Roots, is a mature starter theme with Blade and Tailwind CSS, powered by Acorn. It fits a normal WordPress site where WordPress stays in charge, and it is far more widely used than Pollora. [Timber](https://github.com/timber/timber) brings Twig templates to WordPress without Laravel and has a large community. Pollora's Blade support comes with a Laravel application around it: routing, controllers, Eloquent and queues. [How Pollora compares](/compare/) covers the differences in detail, and [Why Pollora](/why/) explains the approach. To start, follow the [installation guide](/getting-started/installation/).
