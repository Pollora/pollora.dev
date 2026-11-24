---
title: "Pollora 13.44.0: Laravel 13.44 and a safer object cache drop-in"
description: "Pollora moves to Laravel 13.44. The object cache drop-in no longer stops a site when the Composer autoloader it names cannot be read by the web server, and it now says why in the PHP error log."
metaDescription: "Pollora 13.44.0: built on Laravel 13.44, and pollora/object-cache 0.3.1 keeps the site up and logs it when the web server cannot read the autoloader."
date: 2026-11-24
category: release
version: 13.44.0
---

13.44.0 follows [13.43.4](/blog/pollora-13-43-4-object-cache-ships-with-the-framework/), published earlier the same day: Laravel released 13.44 in between, and the framework follows Laravel's line. Nothing in the framework's own code changes for it; the `illuminate/*` packages are required at `^13.44` and the test suite and static analysis run against 13.44.

## What you get

**Built on Laravel 13.44.** A new project created from the skeleton v13.44.0 installs Laravel 13.44 and the framework 13.44.0. An existing project updates with `composer update`.

**A safer object cache drop-in.** The persistent object cache ([`pollora/object-cache`](/advanced/object-cache/), now 0.3.1) loads the Composer autoloader recorded in `object-cache.php`, because WordPress runs the drop-in before any plugin. When that path is under a home directory the web server cannot enter (a package installed with `wp package install` lands there), the cache used to stay off without a word, and when the file existed but the web server could not open it, the site stopped with a fatal error. Now the drop-in stays inert and WordPress keeps its own cache, and it writes a line to the PHP error log with the path, on each request that cannot read it. `pollora:object-cache:status` has a new `Autoloader` line: the path, whether the user who runs the command can read it, and a flag for a path in that user's home directory; it fails when the path cannot be read. It cannot test the web server's own account, which is why the error log line matters.

**A performance report that records the machine.** The nightly job that compares boot time, cold discovery and a thumbnail with the last good night now also records how fast the machine ran two fixed pieces of work. It does not judge them yet: shared runners vary by a factor of two, and the data will say whether timings can be compared as ratios. The gate itself is unchanged.

## Upgrade

```bash
composer update pollora/framework
php artisan pollora:object-cache:enable   # only if the object cache was installed before: it rewrites the drop-in
```

`enable` is what updates the drop-in file. A project that never enabled the object cache is not affected.
