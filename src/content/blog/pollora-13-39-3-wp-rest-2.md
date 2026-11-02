---
title: "Pollora 13.39.3: REST routes are private unless you say otherwise"
description: "The framework now accepts pollora/wp-rest 2.0, and composer update installs it: a REST route declared with #[WpRestRoute] that names no permission is refused. One line per public route keeps it open, and a filter gives you time to migrate."
date: 2026-11-02
category: release
version: 13.39.3
---

13.39.3 lets `composer update` install [`pollora/wp-rest` 2.0](https://github.com/Pollora/wp-rest/releases/tag/2.0.0), published on 29 October. It is a release of its own because it changes what a site answers: **a REST route that declares no permission is now refused.** The framework follows Laravel, so 13.39 is still built on Laravel 13.39.

13.39.2 held it back on purpose. Accepting it there would have switched every site to "private by default" on its next `composer update`, in a release that was only meant to carry fixes.

## What changes

A route declared with `#[WpRestRoute]` and no `permissionCallback` used to be public, and WordPress only logged a `_doing_it_wrong()` notice. With wp-rest 2.0 it answers `rest_forbidden`: 401 for a visitor, 403 for a logged-in user.

Routes you register yourself with `register_rest_route()` are not touched: wp-rest only governs the ones Pollora registers from the attribute.

## If a route is public on purpose

Say so. `Everyone` is the explicit way to leave a route open:

```php
use Pollora\WpRest\Permissions\Everyone;

#[WpRestRoute('app/v1', '/status', permissionCallback: Everyone::class)]
class StatusEndpoint
{
    // ...
}
```

Any other permission works the same way, for example `IsLoggedIn` or `IsAdmin`. A site already on wp-rest 0.2 has been getting a `_doing_it_wrong()` notice naming each route that declares nothing, with the fix: if yours is quiet under `WP_DEBUG`, nothing breaks.

## If you need time

Two ways, depending on how long:

- **Migrate later, keep running.** Return `false` from the `pollora/wp-rest/private_by_default` filter. Routes without a permission stay public, and with `WP_DEBUG` WordPress tells you which one to fix.

  ```php
  add_filter('pollora/wp-rest/private_by_default', '__return_false');
  ```

- **Stay on the previous behaviour.** Require `"pollora/wp-rest": "^0.2"` in your `composer.json`. There is no 1.x: the line went from 0.2 to 2.0.

The filter was named `pollora/wp_rest/private_by_default` in 0.2.0. That name and the `WpRestRouteRegistrar::PRIVATE_BY_DEFAULT` constant, deprecated since 0.2.1, are removed in 2.0.

## Upgrade

```bash
composer update
```

1. List your `#[WpRestRoute]` classes that have no `permissionCallback`.
2. Give each one `Everyone::class` or a real permission.
3. Request the public ones as a visitor and check they still answer.

## Also in this release

The distribution archive no longer carries the framework's development files (`.harness.json`, `AGENTS.md`, `api-surface.json`, `composer-dependency-analyser.php`), and the development tooling requires [`pollora/harness`](https://github.com/Pollora/harness) `^0.1.15`. Nothing changes at run time.
