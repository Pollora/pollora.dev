---
title: "Pollora 13.43.4: the object cache ships with the framework"
description: "pollora/object-cache 0.3 no longer needs Laravel and comes with Pollora: nothing to require, the same Artisan commands, and the same settings. It also runs on a classic WordPress or Bedrock site."
metaDescription: "Pollora 13.43.4: the Redis object cache ships with the framework, pollora/object-cache 0.3 runs without Laravel, and the OBJECT_CACHE_* variables work again."
date: 2026-11-24
category: release
version: 13.43.4
---

13.43.4 follows [13.43.2](/blog/pollora-13-43-2-sqlite-object-cache-doctor/) on the same Laravel line, 13.43. It also covers 13.43.3, which was tagged the same day and had one regression that 13.43.4 fixes: update straight to 13.43.4.

## What you get

**The persistent object cache comes with the framework.** [`pollora/object-cache`](/advanced/object-cache/) 0.3 no longer depends on Laravel: it needs PHP and phpredis only, and it can also run on a classic WordPress or Bedrock site (a `WP_OBJECT_CACHE_CONFIG` constant for the settings, `wp object-cache` for the commands). Pollora requires it, so there is nothing to `composer require` any more. The Laravel side lives in the framework: the Redis connection is still read from `config/database.php`, the `pollora:object-cache:enable`, `disable`, `status` and `flush` commands keep their names, `Cache::store('wordpress')` and the `cache:clear` hook are unchanged, and so are the `pollora.object-cache.*` settings that `pollora/woocommerce` writes to. The package has not run in production yet, and its use outside Pollora is new: pin its version.

**One step after the update.** The drop-in is now version 2. If you had installed the object cache with 0.1 or 0.2, run `php artisan pollora:object-cache:enable` again to replace it. Nothing else changes: a project that never enabled the cache is not affected.

**`pollora/media` 0.10 is accepted.** `media` 0.10.0 refuses an empty signing key for size signatures, so a size URL cannot be signed by anyone when `app.key` is empty.

## Fixes

- The `OBJECT_CACHE_*` environment variables (`OBJECT_CACHE_PREFETCH`, `OBJECT_CACHE_REDIS_DATABASE`, `OBJECT_CACHE_PREFIX` and the others the earlier releases of the package read) were ignored in 13.43.3. They work again, and the settings are merged key by key over the package defaults, so a list you set (`prefetch.exclude_groups`) replaces the default list instead of mixing with it.
- A flush now says so when Redis cannot be reached, instead of reporting an empty cache.

## Upgrade

```bash
composer update pollora/framework
php artisan pollora:object-cache:enable   # only if the object cache was installed before
```

A new project created from the skeleton v13.43.4 installs the framework v13.43.4 with the object cache included. `pollora:doctor` tells you whether the drop-in is in place.
