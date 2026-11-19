---
title: "Pollora 13.43.1: media 0.9 and the warm discovery cache"
description: "A new project now installs pollora/media 0.9 and pollora/discovery 0.2. The first brings the media security fixes, the second a discovery cache that reads no file once it is warm, at the price of one command to clear it when you change a class."
metaDescription: "Pollora 13.43.1 installs pollora/media 0.9 and pollora/discovery 0.2: the media security fixes and a discovery cache that reads no file."
date: 2026-11-19
category: release
version: 13.43.1
---

13.43.1 lets `composer update` install two packages published the same day as [13.43.0](/blog/pollora-13-43-ajax-nonce-capability-security/): `pollora/media` 0.9 and `pollora/discovery` 0.2. The framework's constraints in 13.43.0 left them out, so a project created with 13.43.0 still gets `pollora/media` 0.8 and `pollora/discovery` 0.1.

## What you get

**`pollora/media` 0.9** carries the media security fixes: a file is resized only to the sizes you declared or signed, the patterns that validate a file name are anchored so a trailing line break no longer slips through, and a signature is compared in constant time.

**`pollora/discovery` 0.2** keeps a cache that reads no file once it is warm. On 200 classes, a developer's machine took about 0.24 ms with a warm cache against about 7.9 ms cold. These numbers are an orientation, not a promise: the guarantee is that a warm cache does not read, list or stat any source file.

## One thing to know about the cache

Nothing invalidates the cache by modification time. A class you edit, add or remove is not seen until the cache is cleared:

```bash
php artisan discovery:clear
```

Add it to your deployment script if it is not there already. The [auto-discovery page](/core-concepts/auto-discovery/) describes the cache in full.

## Packages published with it

`pollora/discovery` 0.2 could not be installed next to six packages that required `^0.1 || ^1.0`. They accept it now: `pollora/schedule` 1.0.1, `pollora/meta` 0.1.1, `pollora/block-bindings` 0.2.1, `pollora/roles` 0.2.1, `pollora/wp-cli` 0.1.2 and `pollora/wp-rest` 2.0.1. A project that pins one of them below these versions keeps `pollora/discovery` 0.1.

## Upgrade

```bash
composer update pollora/framework
```

A new project created from the skeleton v13.43.1 installs all of this. The framework's architecture tests also report a layer that an installed package shares as not evaluated instead of failing, which is what `pollora/media` 0.9 triggered in the framework's own suite.
