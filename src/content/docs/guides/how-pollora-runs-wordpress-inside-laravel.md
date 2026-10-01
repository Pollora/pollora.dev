---
title: How Pollora runs WordPress inside Laravel
description: "A request through Pollora, step by step: Laravel boots, WordPress loads in a service provider, and Route::wp() or the template hierarchy picks the view."
sidebar:
  order: 5
---

Pollora is a Laravel application that loads WordPress as part of its own boot. Laravel receives the request, WordPress core runs inside a service provider, and the Laravel router decides what to render, using WordPress's conditional tags and template hierarchy. The admin, the REST API and plugins keep working.

This article follows one request through that pipeline and then looks at the paths that do not go through it: wp-admin, wp-login, REST, AJAX and cron. Paths starting with `src/` are in [`pollora/framework`](https://github.com/Pollora/framework); the others are in the `pollora/pollora` skeleton. Excerpts are trimmed but not rewritten.

## The layout

The skeleton is a Laravel application with WordPress installed by Composer under the document root:

- `public/index.php` is Laravel's front controller.
- `public/cms/` holds WordPress core (`"wordpress-install-dir": "public/cms"` in `composer.json`).
- `public/content/` replaces `wp-content`: plugins, themes, uploads.
- `public/wp-config.php` is the file WordPress's own scripts load. It boots Laravel.

The `.htaccess` sends every request that is not a real file or directory to `index.php`. So `/`, `/blog/hello-world` and `/wp-json/wp/v2/posts` reach Laravel, while `/cms/wp-login.php` and `/cms/wp-admin/` are PHP files that the server runs directly.

## 1. The entry point

`public/index.php` is the stock Laravel 13 front controller:

```php title="public/index.php"
require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
```

Nothing WordPress-specific happens here. The framework is wired in through Laravel package discovery: `pollora/framework` declares `Pollora\Providers\PolloraServiceProvider`, which registers about forty providers (`src/Providers/PolloraServiceProvider.php`). The one that matters for this article is `WordPressServiceProvider`, registered near the end of that list.

## 2. WordPress configuration comes from Laravel

During `register()`, before any provider boots, `src/WordPress/Bootstrap.php` defines the constants that would normally live in `wp-config.php`. Values come from Laravel config, and anything in `config('wordpress.constants')` is queued after the defaults, so it replaces them:

```php title="src/WordPress/Bootstrap.php"
Constant::queue('WP_USE_THEMES', ! $this->consoleDetectionService->isConsole() && ! str_starts_with((string) request()->server('REQUEST_URI'), '/cms/'));
Constant::queue('WP_AUTO_UPDATE_CORE', false);
Constant::queue('DISABLE_WP_CRON', true);
Constant::queue('WP_POST_REVISIONS', 5);

$debugMode = $this->debugDetector->isDebugMode();
Constant::queue('WP_DEBUG', $debugMode);

foreach ((array) config('wordpress.constants', []) as $key => $value) {
    Constant::queue(strtoupper((string) $key), $value);
}

Constant::apply();
```

Paths and URLs are derived from `APP_URL`: `ABSPATH` is `public/cms/`, `WP_SITEURL` is `APP_URL/cms`, `WP_HOME` is `APP_URL`, and `WP_CONTENT_DIR`/`WP_CONTENT_URL` point to `public/content`. In `boot()`, the database constants (`DB_NAME`, `DB_USER`, `DB_HOST` with the port appended, and so on) are copied from `DB::getConfig()`, so WordPress and Eloquent use the same connection settings. The constant manager skips any constant that is already defined (`src/WordPress/Config/ConstantManager.php`). The authentication keys and salts come from `.env` through `config/wordpress.php`.

`register()` also loads WordPress's plugin API early, so `add_filter()` exists before WordPress itself does:

```php title="src/WordPress/Bootstrap.php"
private function ensureAddFilterExists(): void
{
    if (! function_exists('add_filter')) {
        require_once ABSPATH.'/wp-includes/plugin.php';
    }
}
```

This lets providers that boot earlier, such as hook discovery, attach callbacks before `wp-settings.php` runs. WordPress loads `plugin.php` with `require_once`, so it is not included twice.

## 3. WordPress core loads inside a service provider

`WordPressServiceProvider::boot()` calls `Bootstrap::boot()`. If the database is configured (the check requires the `mysql` driver and opens a PDO connection), it requires WordPress:

```php title="src/WordPress/Bootstrap.php"
private function loadWordPressSettings(): void
{
    global $wp_version;
    global $wp_db_version;
    // ...
    global $wp_filter;
    global $wp_actions;

    if ($this->consoleDetectionService->isConsole() && ! $this->isWordPressInstalled()) {
        define('SHORTINIT', true);
    }

    if ($this->isLightweightRequest()) {
        $this->applyLightweightFilters();
    }

    if (! $this->consoleDetectionService->isWpCli()) {
        require_once ABSPATH.'wp-settings.php';
    }
}
```

The `global` declarations are there because a file required from inside a method runs in that method's scope. Declaring WordPress's core globals first makes the assignments in `wp-settings.php` land in the global scope where the rest of WordPress expects them.

Two other details from the same file:

- The call is wrapped in `withWordPressErrorHandling()`, which swallows `E_DEPRECATED` notices from WordPress and plugins and forwards everything else to Laravel's handler.
- Requests under `/api/` are "lightweight". By default `pre_option_active_plugins` returns an empty array, so no plugins load. `config('wordpress.api_plugins')` can allow a list of plugins (glob patterns accepted), or all of them with `['*']`.

By the end of `wp-settings.php`, plugins, the active theme's `functions.php`, `init` and `wp_loaded` have run, all inside Laravel's provider boot.

## 4. WordPress parses the request

Still in `boot()`, if WordPress is installed and this is not a console run, `runWp()` runs the main query:

```php title="src/WordPress/QueryTrait.php"
if ($this->laravelIsServingTheRequest()) {
    wp();

    if (wp_using_themes()) {
        $this->action->do('template_redirect');
    }

    if (is_robots()) {
        $this->action->do('do_robots');
        exit;
    }
    // is_favicon(), is_feed() and is_trackback() are handled the same way
}

$this->action->do('pollora_loaded');
```

`wp()` parses the URL against WordPress's rewrite rules and fills `$wp_query`. From here on, `is_single()`, `is_page()` and the other conditional tags return real answers. `template_redirect` fires, so canonical redirects and plugin redirects still happen. Robots, favicon, feeds and trackbacks are answered by WordPress and the script exits. What WordPress does not do is include `template-loader.php`. Rendering is left to Laravel.

`laravelIsServingTheRequest()` compares `$_SERVER['SCRIPT_FILENAME']` with `public/index.php`. That check matters for the admin paths described below.

## 5. The router matches on conditional tags

After the providers have booted, the HTTP kernel dispatches the request to the router. Pollora replaces Laravel's router with `ExtendedRouter`, which creates its own `Route` model, and adds two macros, `Route::wp()` and `Route::wpMatch()`. A WordPress route stores a condition instead of matching a URI:

```php title="src/Route/Infrastructure/Models/Route.php"
public function matches(Request $request, $includingMethod = true): bool
{
    $this->compileRoute();

    if ($this->isWordPressRoute() && $this->hasCondition()) {
        return $this->matchesWordPressCondition();
    }

    return parent::matches($request, $includingMethod);
}
```

`matchesWordPressCondition()` calls the conditional function with any extra arguments, so `Route::wp('page', 'contact', ...)` runs `is_page('contact')`. Aliases such as `single`, `front` or `tax` resolve to `is_single`, `is_front_page` or `is_tax` through `WordPressConditionManager` and the `conditions` key of `config/wordpress.php`. Routes are tried in the order they were registered, so ordinary URI routes and `Route::wp()` routes in `routes/web.php` behave as you would expect from Laravel.

```php title="routes/web.php"
Route::wp('single', [BlogController::class, 'show']);
Route::wp('page', 'contact', [ContactController::class, 'show']);
```

WordPress routes get three middleware. `WordPressBindings` injects the current `WP_Post`, `WP_Term`, `WP_User`, `WP_Query` or `WP` object into any controller parameter type-hinted with one of those classes. The other two are described in step 7. See [WordPress routes](/routing/wordpress-routes/) and [controllers](/routing/controllers/) for the full syntax.

When a plain Laravel route such as `/dashboard` matches, WordPress has already parsed that URL and marked it as a 404. The `ApplyApplicationRouteContext` listener resets `$wp_query->is_404` and adds body classes derived from the route, so the page does not carry WordPress's `error404` state.

## 6. The template hierarchy is the fallback

If nothing else matches, a catch-all route registered once the application has booted takes the request:

```php title="src/Route/Infrastructure/Providers/RouteServiceProvider.php"
$route = Route::any('{any}', [FrontendController::class, 'handle'])
    ->where('any', '^(?!api/).*')
    ->middleware(self::WORDPRESS_MIDDLEWARE);
```

`FrontendController` repeats what WordPress's `template-loader.php` does: it walks `is_404`, `is_search`, `is_front_page`, `is_single`, `is_page`, `is_archive` and the rest, calls the matching `get_*_template()` function, falls back to `get_index_template()`, and applies the `template_include` filter. The difference is the last step: the resulting file path is converted to a view name and rendered with `View::make()`, with a 404 status when `is_404()` is true.

Blade templates enter the hierarchy through filters. `RegisterTemplateHierarchyFiltersUseCase` hooks every `*_template_hierarchy` filter, and `FileSystemTemplateFinder::locate()` turns each candidate such as `single-book.php` into `single-book.blade.php` and looks for it in the theme's view paths. Blade candidates are ranked ahead of PHP ones. The [Blade templates guide](/guides/blade-templates-wordpress/) covers the theme side.

## 7. After the controller

Two middleware act on the response:

- `WordPressHeaders` adds `X-Powered-By: Pollora` (can be turned off) and, for visitors who are not logged in, replaces WordPress's no-cache headers on HTML responses with `public, must-revalidate, max-age=…`. The default is 3600 seconds (`WP_CACHE_MAX_AGE`), with optional per-condition TTLs (`wordpress.cache.ttl`) and `s-maxage`. It respects `DONOTCACHEPAGE` and any `max-age`, `s-maxage` or `no-store` the application set itself.
- `WordPressShutdown` runs WordPress's `shutdown` action inside an output buffer, injects anything it printed before `</body>`, then removes all `shutdown` callbacks so they do not run twice.

## Requests that skip the Laravel router

**wp-admin and wp-login.** PHP runs `public/cms/wp-login.php` or a file under `public/cms/wp-admin/` directly. WordPress's `wp-load.php` looks for `wp-config.php` in `ABSPATH`, then one directory up, and finds `public/wp-config.php`. That file boots Laravel by hand:

```php title="public/wp-config.php"
$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$app->bootstrapWith([
    LoadEnvironmentVariables::class,
    LoadConfiguration::class,
    HandleExceptions::class,
    RegisterFacades::class,
    SetRequestForConsole::class,
]);

$app->instance('request', Request::capture());

$app->bootstrapWith([
    Illuminate\Foundation\Bootstrap\RegisterProviders::class,
    Illuminate\Foundation\Bootstrap\BootProviders::class,
]);
```

Booting the providers runs `Bootstrap::boot()`, which requires `wp-settings.php`. Control then returns to the admin script, and the HTTP kernel never handles the request. Because the running script is not `public/index.php`, `runWp()` skips `wp()`. That avoids a real bug recorded in the framework changelog: `/cms/wp-login.php` matched the attachment rewrite rule and was sent with a 404 status. `WP_USE_THEMES` is false for `/cms/` URLs. A `template_include` filter at `PHP_INT_MAX` redirects to the home URL if a `.blade.php` file is about to be included outside Laravel, rather than printing Blade source.

**REST API.** `/wp-json/...` is not a file, so it goes through `index.php`. WordPress core hooks `rest_api_loaded` to `parse_request`, so the `wp()` call in step 4 serves the REST response and calls `die()`. This happens during provider boot, before the Laravel router runs. The skeleton excludes `wp-json/*` from CSRF checks and from the trailing-slash redirect in `.htaccess`. Custom endpoints can be declared with `#[WpRestRoute]` ([REST API](/advanced/rest-api/)).

**AJAX.** `admin-ajax.php` lives in `wp-admin`, so it follows the admin path. The `Ajax` facade and `#[Ajax]` attribute register ordinary `wp_ajax_*` hooks ([AJAX](/advanced/ajax/)).

**Cron.** `DISABLE_WP_CRON` is true by default, so page views do not trigger WordPress's pseudo-cron. With `wordpress.use_laravel_scheduler` enabled, `src/Schedule/` intercepts WordPress's cron storage (`pre_schedule_event`, `pre_option_cron` and related filters) and runs events as Laravel jobs and scheduled callbacks ([scheduling](/advanced/scheduling/)).

## Hooks as attributes and events

Hook attributes are found by discovery, not registration. `ModuleServiceProvider` scans `app/` with `spatie/php-structure-discoverer`, and `src/Hook/Infrastructure/Services/HookDiscovery.php` collects public methods carrying `#[Action]` or `#[Filter]`, then registers them with an instance resolved from the container:

```php title="src/Hook/Infrastructure/Services/HookDiscovery.php"
$action = $hookAttribute->newInstance();

$instance = $this->getInstanceFromPool($className);
$this->actionService->add(
    hooks: $action->hook,
    callback: [$instance, $methodName],
    priority: $action->priority
);
```

In the other direction, `src/Events/WordPress/` turns selected WordPress actions into Laravel events. Each dispatcher subscribes to a list of hooks and maps them to event classes. `PostEventDispatcher`, for example, reads `transition_post_status` and dispatches `PostCreated`, `PostPublished`, `PostTrashed`, `PostRestored` or `PostUpdated`. See [actions and filters](/hooks/actions-filters/) and [events and listeners](/hooks/events-listeners/).

## Performance in the code

- **Discovery cache.** Discovered structures are cached through Laravel's cache under a `pollora` prefix, except in debug mode, where a null driver forces a fresh scan (`src/Discovery/Infrastructure/Services/DiscoveryCacheManager.php`). In debug mode a slow scan is logged.
- **Template lookups** are memoised per request (`FileSystemTemplateFinder::$locateCache`). Blade page templates, found by scanning views for a `{{-- Template Name: ... --}}` comment, are cached with `wp_cache_set()`.
- **`/api/` requests** skip plugins by default, as shown in step 3.
- **HTTP caching** for anonymous visitors is on by default (step 7).

## Trade-offs

- **Every web request boots both frameworks.** Front-end pages run Laravel and a full `wp-settings.php`, plugins included. Admin requests boot Laravel as well, through `wp-config.php`. The `/api/` mode is the only built-in way to load less.
- **WordPress core is patched.** WordPress and Laravel both declare a global `__()`. Pollora applies a Composer patch that renames WordPress's to `__wp()` (`patches/wordpress-core.patch`), and `pollora/helper-overrider` provides one `__()` that serves both translation systems. The patch is applied by `cweagans/composer-patches`, and `pollora:doctor` checks that it is present.
- **Core updates go through Composer.** `WP_AUTO_UPDATE_CORE` is false.
- **WP-Cron needs a decision.** It is off by default, so scheduled events need a real cron or the Laravel scheduler mode.
- **Front-end rendering is Laravel's.** Plugins that depend on `template-loader.php` including a PHP file see the same `template_include` filter, but the result is rendered as a view. Block themes still work: their `template-canvas.php` is included by `FrontendController` when no Blade view exists.

If you want the opposite arrangement, with WordPress in charge and Laravel components added to it, look at Acorn. [How Pollora compares](/compare/) sets the options side by side, and [Why Pollora](/why/) explains the reasons for this design. To try it, start with the [installation guide](/getting-started/installation/) and the [WordPress configuration reference](/core-concepts/wordpress-config/).
