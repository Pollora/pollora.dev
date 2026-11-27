---
title: "Skeleton 13.44.4, and this week's package releases"
description: "Projects created between 13.43.2 and 13.44.3 hold a demo site with two REST routes open to everyone: here is what to delete. Plus WordPress 7.1.5 and the package releases since 13.44.2."
metaDescription: "Delete the demo site from projects created with Pollora 13.43.2 to 13.44.3, get WordPress 7.1.5, and see this week's package releases."
date: 2026-11-27
category: release
version: 13.44.4
---

Two releases of the skeleton, `pollora/pollora`, one of them a security fix that **needs an action on existing projects**. The framework itself stays at 13.44.2.

## Check this: projects created from 13.43.2 to 13.44.3

Releases v13.43.2 to v13.44.3 of the skeleton committed a demo site by mistake, and `composer create-project` copied it into every new project. Among it, two REST routes open to everyone:

- `/wp-json/starter/v1/status` answers with the PHP and WordPress versions, the active theme and the registered post types and taxonomies;
- `/wp-json/starter/v1/projects` lists the entries of a demo `project` post type.

The demo also brings post types, scheduled tasks and WP-CLI commands. v13.44.4 no longer ships any of it, but **updating Composer dependencies does not remove files from a project that already has them**. If you created yours from one of those releases, delete what it does not use, after checking that nothing of yours was built on it:

- `app/Cms/`: everything except `.keep` and `PostTypes/Book.php` (`Cli/`, `Hooks/`, `Rest/`, `Schedule/`, `Taxonomies/`, `PostTypes/Project.php`, `Service.php`, `TestCase.php`). WordPress keeps the cron events these classes scheduled until you unschedule them (`wp cron event list`).
- `themes/apiary`, `themes/buzz`, `themes/pollora-starter` (a theme is generated with `php artisan pollora:make:theme`). Do not delete the active theme.
- `Modules/BlocksDemo`, `Modules/Test` and `modules_statuses.json` (if you added modules of your own, only remove these two entries from it).
- The `fr_FR` files of `public/content/languages/`, unless the site is in French.
- `.claude/`, the root `pollora` script, `tailwind.safelist.txt` and `tests/Feature/Routing/`.

The advisory is [GHSA-cc8h-82vm-v956](https://github.com/Pollora/pollora/security/advisories/GHSA-cc8h-82vm-v956) (medium).

## WordPress 7.1.5 (13.44.3)

The lock of the skeleton now pins WordPress 7.1.5, a [security release](https://wordpress.org/news/2026/11/wordpress-7-1-5-release/). v13.44.2 and earlier, published after 7.1.5 came out, still installed 7.1.4. On an existing project:

```bash
composer update johnpbloch/wordpress --with-dependencies
```

Create new projects from v13.44.4 or later.

## Packages

All of these install on Pollora 13.44.2 with `composer update`.

**Security**

- [`pollora/wp-rest` 2.0.4](https://github.com/Pollora/wp-rest/releases/tag/2.0.4): `Can(parameter:)` now refuses a request whose parameter is missing or is not a positive integer, where WordPress fell back on the current post. A custom capability that took another kind of identifier is now always refused: write a `Permission` class for it.
- [`pollora/media` 0.10.0](https://github.com/Pollora/media/releases/tag/v0.10.0): a size signature is never made with an empty key. **Breaking** only if you build the thumbnail drivers by hand: their constructors take the declared sizes.
- [`pollora/woocommerce` 0.2.1](https://github.com/Pollora/woocommerce/releases/tag/v0.2.1): a share key option that is not text no longer opens the Coming Soon page. 0.3.0 contains the same fix.

**Breaking**

- [`pollora/woocommerce` 0.3.0](https://github.com/Pollora/woocommerce/releases/tag/v0.3.0): `WooCommerceService` and `WordPressWooCommerceAdapter` are now `final`. Implement or mock their new interfaces instead of extending them.

**Fixes**

- [`pollora/object-cache` 0.3.3](https://github.com/Pollora/object-cache/releases/tag/v0.3.3): a Redis host that does not resolve no longer prints a raw PHP warning, and `wp_cache_delete_multiple()` no longer stops the request on an unusable key.
- [`pollora/hook` 2.0.3](https://github.com/Pollora/hook/releases/tag/v2.0.3): invokable objects and `'Class::method'` strings can be registered without an argument count.
- [`pollora/discovery` 0.3.1](https://github.com/Pollora/discovery/releases/tag/v0.3.1): a damaged or outdated discovery cache is rebuilt instead of failing with a `TypeError`.

**MeiliFacets**

- [MeiliFacets 0.6.0](https://github.com/Pollora/MeiliFacets/releases/tag/0.6.0) (beta): sort a shop by popularity or rating by default, keep ticked boxes across pages. The browser script and the index changed: read the upgrade steps first.

## Coming with the next framework release

`pollora/ajax` 2.0 verifies a nonce by default on every AJAX action, guests included. The released framework still requires 1.x, so nothing changes in your project today; the next framework release will accept 2.0. You can prepare now: send a nonce from your own pages, and write `nonce: false` where no nonce makes sense.
