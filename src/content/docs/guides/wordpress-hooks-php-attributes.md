---
title: WordPress hooks with PHP 8 attributes
description: "Replace add_action and add_filter calls in functions.php with PHP 8 attributes: #[Action] and #[Filter] methods, auto-discovered and container-resolved."
sidebar:
  order: 1
---

WordPress is extended through hooks: actions run code at a given moment, filters change a value before WordPress uses it. This guide shows how to declare hooks with PHP 8 attributes instead of `add_action()` and `add_filter()` calls, first as a general technique and then end to end with Pollora.

## The problem with scattered add_action calls

A typical theme or plugin registers hooks like this:

```php title="functions.php"
add_action('wp_head', 'mytheme_meta_description', 1);
add_filter('body_class', 'mytheme_body_class', 10, 2);

function mytheme_meta_description() {
    if (is_singular()) {
        echo '<meta name="description" content="' . esc_attr(get_the_excerpt()) . '">';
    }
}

function mytheme_body_class($classes, $css_class) {
    $classes[] = 'has-js';
    return $classes;
}
```

This works, and it is how most WordPress code is written. It has a few costs as a project grows:

- **Registration is separate from the code it registers.** The hook name, priority and argument count live on one line, the callback somewhere else, often in another file.
- **The argument count is easy to get wrong.** `add_filter()` passes one argument unless you set the fourth parameter. Forget it and `$css_class` is silently missing.
- **Everything is global.** Callbacks are prefixed functions or static methods, which makes it awkward to give them dependencies or to test them.
- **`functions.php` becomes a registry.** Files are included by hand, and finding what listens to `wp_head` means searching the whole codebase.

Wrapping hooks in classes helps, but you still call `add_action()` in a constructor or an `init()` method, and something still has to instantiate that class.

## What PHP 8 attributes are

Attributes, added in PHP 8.0, are structured metadata attached to classes, methods, properties or parameters:

```php
#[Action('wp_head', priority: 1)]
public function metaDescription(): void {}
```

On their own they do nothing. A framework reads them with the Reflection API (`ReflectionMethod::getAttributes()`) and acts on them. For hooks, that means a method can carry its own hook name and priority, and a scanner can register it. The declaration and the code sit together, and the argument count can be read from the method signature.

## Declaring actions and filters in Pollora

Pollora provides two attributes, `Pollora\Attributes\Action` and `Pollora\Attributes\Filter`. Both take the hook name and an optional `priority` (default `10`). Both can target methods only, and both are repeatable, so one method can listen to several hooks.

Here is the example above as a Pollora class:

```php title="app/Cms/Hooks/Seo.php"
<?php

namespace App\Cms\Hooks;

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
    public function bodyClass(array $classes, array $cssClass): array
    {
        $classes[] = 'has-js';

        return $classes;
    }
}
```

There is no argument count to declare. When Pollora registers the method, it counts the parameters in its signature and passes that number to WordPress as `$accepted_args`. `bodyClass()` declares two parameters, so it receives both values `body_class` provides. If you only need the first one, declare only the first one.

A method that should run on several hooks takes several attributes:

```php title="app/Cms/Hooks/Setup.php"
#[Action('init', priority: 10)]
#[Action('wp_loaded', priority: 15)]
public function setup(): void
{
    // Runs on both hooks
}
```

You can generate a hook class with Artisan:

```bash
php artisan pollora:make:action Seo
php artisan pollora:make:filter ContentFilters
```

## Where the classes live and how they are found

You do not register these classes anywhere. Pollora's discovery system scans your application's `app/` directory (as well as active themes and modules) for public methods carrying `#[Action]` or `#[Filter]`, and registers each one with WordPress. Abstract classes are skipped.

`app/Cms/Hooks` is the convention, and it is where the generators write, but any class under `app/` is found. Group hooks by feature (`Seo`, `Media`, `Admin`) rather than by hook name.

To keep a class out of discovery, add `#[SkipDiscovery]` from `Pollora\Attributes\SkipDiscovery`. See [Auto-discovery](/core-concepts/auto-discovery/) for path exclusions and custom discoveries.

## Dependency injection in hook classes

Discovered hook classes are built through the Laravel service container, so constructor injection works the same way it does in a controller. One instance is created per class and shared by all the hook methods it declares.

```php title="app/Cms/Hooks/Analytics.php"
<?php

namespace App\Cms\Hooks;

use Illuminate\Contracts\Config\Repository as Config;
use Pollora\Attributes\Action;

class Analytics
{
    public function __construct(
        private readonly Config $config,
    ) {}

    #[Action('wp_footer')]
    public function printSnippet(): void
    {
        $id = $this->config->get('services.analytics.id');

        if ($id) {
            echo view('partials.analytics', ['id' => $id])->render();
        }
    }
}
```

Keep constructors light and do WordPress work inside the hook methods, where you know which hook is running.

If a service needs to add hooks itself, inject the hook contracts `Pollora\Hook\Domain\Contract\Action` and `Pollora\Hook\Domain\Contract\Filter`. They are documented as stable public contracts. See [Service access](/hooks/actions-filters/#service-access).

## The facade alternative

Attributes suit hooks that are always on. When registration depends on runtime conditions, use the `Action` and `Filter` facades, for example in a service provider:

```php title="app/Providers/AppServiceProvider.php"
use App\Cms\Hooks\ContentHandler;
use Pollora\Support\Facades\Action;
use Pollora\Support\Facades\Filter;

public function boot(): void
{
    // Resolves ContentHandler from the container and calls its theContent() method
    Filter::add('the_content', ContentHandler::class, 20);

    if (config('app.debug')) {
        Action::add('wp_footer', function (): void {
            echo '<!-- debug -->';
        });
    }
}
```

`add()` accepts a hook name or an array of names, a callback, a priority and an optional argument count (detected from the callback when omitted). When you pass a class name alone, Pollora builds it through the container and calls the method named after the hook in camel case: `theContent()` for `the_content`. `Action::do()` and `Filter::apply()` fire hooks, `exists()` and `remove()` behave like their WordPress counterparts, and `callbacks()` returns what was registered. Like `add_action()`, the facades accept a callback that is not defined yet, such as a function from a plugin that loads later; it is checked when the hook fires. The [Actions & Filters](/hooks/actions-filters/) page covers the full API.

## Checking what was discovered

Discovery results are cached. Two Artisan commands help when a hook does not fire:

```bash
# Run discovery and print how many items each discovery found ("hooks", "post_types", ...)
php artisan discovery:run

# Inspect only hook discovery
php artisan discovery:run --discovery=hooks

# Clear the discovery cache after moving or renaming classes
php artisan discovery:clear
```

If the count for `hooks` does not change after you add a method, check that the method is public, the class is not abstract, and the attribute is imported from `Pollora\Attributes`. Also check that the class can be built by the container: if it cannot (for example, a constructor dependency that does not resolve), that class's hooks are skipped without stopping the request.

## WordPress hooks as Laravel events

For common WordPress events, Pollora also dispatches typed Laravel events, so you can handle them with ordinary listeners, including queued ones:

```php title="app/Listeners/NotifySubscribers.php"
<?php

namespace App\Listeners;

use Pollora\Events\WordPress\Post\PostPublished;

class NotifySubscribers
{
    public function handle(PostPublished $event): void
    {
        $post = $event->post; // WP_Post
        // ...
    }
}
```

Use attributes when you need to change WordPress output or data (a filter must return a value). Use events when you react to something that happened, especially for slow work that belongs in a queue. The list of events is in [Events & Listeners](/hooks/events-listeners/).

## Next steps

- [Actions & Filters](/hooks/actions-filters/): full attribute and facade reference
- [Events & Listeners](/hooks/events-listeners/): WordPress hooks as Laravel events
- [Auto-discovery](/core-concepts/auto-discovery/): how classes are scanned, cached and excluded
- [Custom post types and taxonomies with PHP attributes](/guides/custom-post-types-php-attributes/)
- [Installation](/getting-started/installation/): start a Pollora project
- [Pollora compared with Acorn, Sage, Radicle and Corcel](/compare/)
