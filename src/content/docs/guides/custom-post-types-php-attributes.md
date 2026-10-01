---
title: Custom post types and taxonomies with PHP attributes
description: "Register a WordPress custom post type and taxonomy as PHP classes with attributes: labels, archives, REST API, translation and queries."
sidebar:
  order: 2
---

Custom post types and taxonomies are how WordPress models content beyond posts and pages: books, events, products, and the categories that group them. This guide recaps the plain WordPress approach, then builds a `Book` post type and a `Genre` taxonomy as PHP classes with attributes in Pollora, and finishes with querying and displaying them.

## The plain WordPress way

In WordPress you call `register_post_type()` and `register_taxonomy()` on the `init` hook, usually from `functions.php` or a plugin:

```php title="functions.php"
add_action('init', function () {
    register_post_type('book', [
        'labels' => [
            'name'               => __('Books', 'my-theme'),
            'singular_name'      => __('Book', 'my-theme'),
            'add_new_item'       => __('Add New Book', 'my-theme'),
            'edit_item'          => __('Edit Book', 'my-theme'),
            'new_item'           => __('New Book', 'my-theme'),
            'view_item'          => __('View Book', 'my-theme'),
            'search_items'       => __('Search Books', 'my-theme'),
            'not_found'          => __('No books found', 'my-theme'),
            'not_found_in_trash' => __('No books found in Trash', 'my-theme'),
            'all_items'          => __('All Books', 'my-theme'),
            // ...about twenty more keys exist
        ],
        'public'       => true,
        'has_archive'  => 'books',
        'rewrite'      => ['slug' => 'books', 'with_front' => false],
        'supports'     => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
        'show_in_rest' => true,
        'rest_base'    => 'books',
        'menu_icon'    => 'dashicons-book',
    ]);

    register_taxonomy('genre', ['book'], [
        'labels'            => [/* the same exercise again */],
        'hierarchical'      => true,
        'public'            => true,
        'show_in_rest'      => true,
        'show_admin_column' => true,
        'rewrite'           => ['slug' => 'genre'],
    ]);
});
```

Nothing is wrong with this code, but it has known pain points. The labels array is long and mostly mechanical: the same noun in a dozen sentences. The arguments are an untyped array, so a typo such as `'show_in_reset'` is silently ignored. And the registration lives in a callback that someone has to remember to include.

Some projects wrap this in a class (`class BookPostType { public function register() { ... } }`), which organises the code but still needs an `add_action('init', ...)` and a manual `new BookPostType()` somewhere.

## The attribute approach

With PHP 8 attributes, the class itself is the declaration. Each WordPress argument becomes a typed attribute, and the framework reads them and calls `register_post_type()` for you. Pollora ships one attribute per argument, under `Pollora\Attributes\PostType` and `Pollora\Attributes\Taxonomy`.

### The Book post type

```php title="app/Cms/PostTypes/Book.php"
<?php

namespace App\Cms\PostTypes;

use Pollora\Attributes\PostType;
use Pollora\Attributes\PostType\HasArchive;
use Pollora\Attributes\PostType\MenuIcon;
use Pollora\Attributes\PostType\PublicPostType;
use Pollora\Attributes\PostType\RestBase;
use Pollora\Attributes\PostType\Rewrite;
use Pollora\Attributes\PostType\ShowInRest;
use Pollora\Attributes\PostType\Supports;

#[PostType('book', textDomain: 'my-theme')]
#[PublicPostType]
#[HasArchive('books')]
#[Rewrite(['slug' => 'books', 'with_front' => false])]
#[Supports(['title', 'editor', 'excerpt', 'thumbnail', 'revisions'])]
#[ShowInRest]
#[RestBase('books')]
#[MenuIcon('dashicons-book')]
class Book
{
}
```

What each line does:

- `#[PostType('book')]` names the post type. The slug, singular and plural names are optional: without arguments they come from the class name (`Book` gives `book`, `Book`, `Books`). You can pass them explicitly with `singular:` and `plural:`.
- `#[PublicPostType]` sets `public`. Like most boolean attributes, it defaults to `true` and accepts `false`.
- `#[HasArchive('books')]` enables the archive at `/books/`. `#[HasArchive]` alone uses the default archive slug.
- `#[Rewrite]` controls single URLs, here `/books/{slug}/`.
- `#[Supports]` lists the editor features.
- `#[ShowInRest]` exposes the post type in the REST API, which the block editor needs. `#[RestBase('books')]` sets the route to `/wp-json/wp/v2/books`.

You never write the labels array. Pollora generates the full set from the singular and plural names, using translatable patterns such as `sprintf(__('Edit %s', 'my-theme'), 'Book')`.

You can also scaffold the class:

```bash
php artisan pollora:make:post-type Book
```

### The Genre taxonomy

```php title="app/Cms/Taxonomies/Genre.php"
<?php

namespace App\Cms\Taxonomies;

use Pollora\Attributes\Taxonomy;
use Pollora\Attributes\Taxonomy\Hierarchical;
use Pollora\Attributes\Taxonomy\PublicTaxonomy;
use Pollora\Attributes\Taxonomy\Rewrite;
use Pollora\Attributes\Taxonomy\ShowAdminColumn;
use Pollora\Attributes\Taxonomy\ShowInRest;

#[Taxonomy('genre', objectType: 'book', textDomain: 'my-theme')]
#[Hierarchical]
#[PublicTaxonomy]
#[ShowInRest]
#[ShowAdminColumn]
#[Rewrite(['slug' => 'genre', 'with_front' => false])]
class Genre
{
}
```

`objectType` links the taxonomy to the `book` post type. It accepts a string or an array, and defaults to `['post']` when omitted. `#[Hierarchical]` makes genres behave like categories (parent and child terms, checkboxes in the editor) rather than tags. `#[ShowAdminColumn]` adds a Genre column to the Books list screen.

Generate it with `php artisan pollora:make:taxonomy Genre` if you prefer.

### No registration step

Both classes are found by [auto-discovery](/core-concepts/auto-discovery/): Pollora scans `app/` for classes carrying `#[PostType]` or `#[Taxonomy]` and registers them on WordPress's `init` hook. There is no service provider to edit and no file to include. `app/Cms/PostTypes` and `app/Cms/Taxonomies` are where the generators write, but any location under `app/` works.

As with any new post type, visit **Settings > Permalinks** once (or run `wp rewrite flush`) so WordPress rebuilds its rewrite rules and the `/books/` URLs resolve.

### Labels and translation

PHP attributes only accept constant expressions, so `__()` cannot appear inside one. That gives three options:

- **Keep the generated labels.** They are translatable through the patterns above, with your `textDomain`.
- **Override a few labels statically** with `#[Labels(addNew: 'New Book', notFound: 'No books yet.')]` from `Pollora\Attributes\PostType\Labels`. These strings are not translatable.
- **Return translated labels from `withArgs()`.** Any array it returns is merged into the registration arguments, and `__()` runs at runtime, so `wp i18n make-pot` can extract the strings:

```php title="app/Cms/PostTypes/Book.php"
class Book
{
    public function withArgs(): array
    {
        return [
            'labels' => [
                'name' => __('Books', 'my-theme'),
                'singular_name' => __('Book', 'my-theme'),
                'add_new_item' => __('Add New Book', 'my-theme'),
            ],
        ];
    }
}
```

A fourth option, a `configuring()` method, receives the post type entity and sets arguments fluently. Labels you pass there are merged with the generated ones, which suits translating only a few of them, and the method can also hold logic that depends on runtime state. See [Post Types](/content/post-types/#the-configuring-lifecycle-hook).

## Querying books

Once registered, `book` is an ordinary WordPress post type, so everything you know still works: `WP_Query`, `get_posts()`, the REST API, the admin screens.

```php
$query = new WP_Query([
    'post_type' => 'book',
    'tax_query' => [[
        'taxonomy' => 'genre',
        'field' => 'slug',
        'terms' => 'fantasy',
    ]],
]);
```

Pollora also includes Eloquent models over the WordPress tables. `Pollora\Models\Post` has query scopes for post type, status and taxonomy:

```php
use Pollora\Models\Post;

$books = Post::type('book')
    ->published()
    ->taxonomy('genre', 'fantasy')
    ->newest()
    ->take(12)
    ->get();
```

### Displaying them

You can display books in two ways. With no route defined, Pollora follows the WordPress template hierarchy with Blade views: an `archive-book.blade.php` view renders `/books/`, `single-book.blade.php` renders a single book, and `taxonomy-genre.blade.php` renders a genre page. Each falls back to the more generic view, as in WordPress.

When you want a controller, route on the WordPress conditional tags with `Route::wp()`:

```php title="routes/web.php"
use App\Http\Controllers\BookController;
use Illuminate\Support\Facades\Route;

Route::wp('post-type-archive', 'book', [BookController::class, 'index']);
Route::wp('singular', 'book', [BookController::class, 'show']);
```

```php title="app/Http/Controllers/BookController.php"
<?php

namespace App\Http\Controllers;

use Pollora\Models\Post;

class BookController extends Controller
{
    public function index()
    {
        return view('books.index', [
            'books' => Post::type('book')->published()->newest()->paginate(12),
        ]);
    }

    public function show(\WP_Post $post)
    {
        return view('books.show', ['book' => $post]);
    }
}
```

The `WP_Post` for the current request is injected from its type hint. See [WordPress routes](/routing/wordpress-routes/) and [Controllers](/routing/controllers/).

## Every attribute in one place

This guide used a handful of attributes. Pollora has one for nearly every `register_post_type()` argument, including capabilities, menu position, search exclusion, block templates and admin columns. They are listed in the [Post Type Attributes Reference](/content/post-types-reference/). Taxonomy attributes, including `#[DefaultTerm]`, `#[Exclusive]` and the meta box callbacks, are listed on [Taxonomies](/content/taxonomies/).

## Next steps

- [Post Types](/content/post-types/): `withArgs()`, `configuring()` and internationalization in detail
- [Post Type Attributes Reference](/content/post-types-reference/)
- [Taxonomies](/content/taxonomies/)
- [Auto-discovery](/core-concepts/auto-discovery/)
- [WordPress hooks with PHP 8 attributes](/guides/wordpress-hooks-php-attributes/)
- [Installation](/getting-started/installation/)
- [Pollora compared with Acorn, Sage, Radicle and Corcel](/compare/)
