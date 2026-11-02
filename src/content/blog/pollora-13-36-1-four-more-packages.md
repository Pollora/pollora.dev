---
title: "Pollora 13.36.1: assets, typed meta, roles and Block Bindings are packages"
description: "Four more features leave the framework as packages you can install on their own, with the same class names. A Pollora site renders the same pages, and the packages also run in a plugin or a Bedrock."
date: 2026-10-16
category: release
version: 13.36.1
---

Pollora 13.36.0 turned discovery, the attributes, scheduling, REST routes and WP-CLI commands into packages. This release does the same for four features that mostly talk to WordPress: Vite assets, typed meta, roles and Block Bindings. The framework requires all four, so `composer update` is the whole upgrade, and nothing changes in how you write code: class names, attributes and commands are the ones you know.

The point of a package is that it can be used where the framework is not. Each of these four runs in a plugin, a classic theme or a Bedrock site, with the same declarations, and the framework keeps only what needs Laravel.

## The four packages

[`pollora/assets`](https://github.com/Pollora/assets) holds the asset classes: `AssetManager`, `AssetContainer`, `AssetEnqueuer` (`Asset::add()->container()->useVite()`) and the notice that tells wp-admin a build is missing. Without Laravel it resolves a Vite build on its own, so a classic theme built with `@pollora/vite-config` can use the same `Asset::add()` call. The framework keeps `ViteManager`, so `ASSET_URL`, a CDN and the application URL keep applying in a Pollora site. See [Assets and Vite](/theming/assets-vite/).

[`pollora/meta`](https://github.com/Pollora/meta) holds [typed meta](/content/typed-meta/): `MetaAccessor`, the fluent `MetaRecord`, the schema builder, the value caster, the WordPress registration and the contract UI drivers (ACF, Meta Box) implement. The Eloquent accessors (`HasTypedMeta`), the `Meta` facade and the Laravel validator stay in the framework.

[`pollora/roles`](https://github.com/Pollora/roles) holds [roles and capabilities](/advanced/roles-capabilities/): the role builder and registry, the compiler, the `WP_Roles` injection and the reading of stored roles. The `role` middleware, the `@role` directive and the bridge to `$user->can()` stay in the framework.

[`pollora/block-bindings`](https://github.com/Pollora/block-bindings) holds [Block Bindings](/blocks/block-bindings/): the resolver, the four sources Pollora ships (`pollora/post-meta`, `pollora/term-meta`, `pollora/author-meta`, `pollora/option`), the discovery of your own sources and the editor script. It builds on `pollora/meta`.

Each page of the documentation now ends with a section on wiring the package without Laravel, taken from the package's README.

## What did not change

The extraction touched a lot of files, so it was checked against reference captures of a demo site taken before it: the rendered pages, the REST responses of the meta, the editor data, the roles stored in the database, and the output of `pollora:meta:list`, `pollora:roles:list`, `pollora:binding:list` and `pollora:doctor`. They are identical. The browser tests that run on every pull request pass too.

## One thing to know: `pollora/query` 2.0

The framework now accepts [`pollora/query`](https://github.com/Pollora/Query) `^1.0 || ^2.0`. Version 2.0 covers every WordPress query class, but `composer update` takes it, and a few fixes change the result of a query that used to run:

- `where()` followed by `orWhere()` groups the earlier clauses: `(a AND b) OR c`.
- `DateQuery::inclusive()` now takes effect, and dates use a 24-hour clock.
- An invalid `fields()`, `userPermission()` or `orderBy()` direction throws a `QueryException` instead of being ignored.

If your project uses these builders, read the [upgrading guide](https://github.com/Pollora/Query/blob/2.0.0/docs/upgrading.md) before updating, or require `pollora/query` `^1.0` yourself to stay on 1.x.

## Upgrade

```bash
composer update pollora/framework --with-dependencies
php artisan pollora:doctor
```

The Blade blocks and patterns are the next feature on the [roadmap](/roadmap/) to become a package.
