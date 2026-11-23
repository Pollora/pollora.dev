---
title: "Pollora 13.43.2: SQLite for development and a persistent object cache"
description: "A new project can run on SQLite for development, CI and demos, pollora:doctor suggests a persistent Redis object cache and reports a WordPress network, and a handful of fixes close gaps in authentication, module downloads and the main site of a network."
metaDescription: "Pollora 13.43.2: opt-in SQLite, the pollora/object-cache package suggested by pollora:doctor, a multisite check and fixes."
date: 2026-11-23
category: release
version: 13.43.2
---

13.43.2 follows [13.43.1](/blog/pollora-13-43-1-media-0-9-discovery-0-2/) on the same Laravel line, 13.43. It adds an opt-in SQLite setup, three `pollora:doctor` checks and a first release of a package that keeps the WordPress object cache in Redis.

## What you get

**SQLite, opt-in, for development, CI and demos.** `pollora:install --db=sqlite` points the project at a SQLite file and installs it. WordPress still speaks MySQL: the SQLite Database Integration plugin translates its queries, through a `db.php` drop-in that the skeleton provides when `DB_CONNECTION=sqlite`. It is not for production, and a project that does not ask for it behaves exactly as before. A `pollora:doctor` check fails when the plugin or the drop-in is missing, or when the database file sits under `public/`, and warns when the file can be read by every account.

**A persistent object cache.** WordPress keeps its object cache for one request unless a drop-in stores it elsewhere. [`pollora/object-cache`](/advanced/object-cache/) 0.1.0 is that drop-in for Redis: it implements the whole `WP_Object_Cache` contract, adds a `wordpress` Laravel cache driver, and a flush only removes the site's own keys. It has not run in production yet, so pin its version. The new `object-cache-package` check of `pollora:doctor` (console only) suggests it when phpredis is loaded and no drop-in persists the cache, and warns when the package is installed without its drop-in.

**Two more `pollora:doctor` checks.** One reports a WordPress network and lists the limits that were measured. The other warns, and never fails, when a security plugin does not run on `/api/` routes, which load no plugin except those in `wordpress.api_plugins`.

## Fixes

- `WordPressGuard` fails closed when the `username` or the `password` is missing, and `viaRemember()` now answers from the lifetime of the session token instead of `true` whenever a cookie exists.
- `ModuleDownloader` streams the archive to a file and refuses one above 100 MiB.
- In a network, the main site no longer answers with the `/cms` home URL, and a console command reaches the site and says why when it cannot.
- The SQLite file the installer creates is no longer world-readable.
- The `@method` annotations of the `Option`, `PostType`, `Taxonomy`, `WordPressError`, `Theme` and `Action` facades describe what each facade really exposes. Only documentation comments change.

## Upgrade

```bash
composer update pollora/framework
```

A new project created from the skeleton v13.43.2 installs the framework v13.43.2. To try the object cache, install `pollora/object-cache` and run `php artisan pollora:object-cache:enable`; `pollora:doctor` tells you whether it is in place.
