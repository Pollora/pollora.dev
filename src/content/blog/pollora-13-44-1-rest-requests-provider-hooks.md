---
title: "Pollora 13.44.1: REST requests get the hooks your providers add"
description: "REST requests were answered before the application's and the theme's providers had booted. 13.44.1 fixes it, and in doing so builds the main query later, on front-end pages too: check your project before updating."
metaDescription: "Pollora 13.44.1: REST requests get the hooks added in providers' boot(). The main query is now built later: check your project before updating."
date: 2026-11-26
category: release
version: 13.44.1
---

13.44.1 fixes REST requests. It also changes when WordPress builds the main query, on front-end pages too, so read [what to check](#check-this-before-updating) before updating.

## The fix

WordPress answers a REST request (`/wp-json/…`, `/?rest_route=…`) while it parses the request, inside `wp()`, and exits. Pollora called `wp()` while Laravel was still booting its providers, before the application's and the theme's providers had booted. Every filter, action, binding or REST route those providers add in `boot()` was missing from REST requests: a block editor save did not fire a `save_post` hooked there, and a route registered there answered `rest_no_route`.

`wp()` now runs once every provider has booted, just before `template_redirect` and still before routing.

If you moved hooks to `register()` to work around this, you can move them back to `boot()`. If you hooked in both, you now get them twice.

[nmetahri](https://github.com/nmetahri) [reported the problem](https://github.com/Pollora/framework/issues/708) and [wrote the fix](https://github.com/Pollora/framework/pull/709): thank you.

## Check this before updating

The main query is now built after the application's and the theme's providers have booted.

- **Hooks on the main query now apply.** A `pre_get_posts`, `parse_query` or `request` hook added in a provider's `boot()` was not applied until now. It is applied now, so an existing site can show different content.
- **Reading the main query too early no longer works.** A provider that calls `is_*()` or `get_queried_object()`, or reads query vars, in its `boot()` now runs before the query is parsed. So does a route file that reads it while it is loaded. Read it from a hook such as `wp`, or inside the route.
- **A `booted()` callback is not enough.** One registered in `register()`, or by a provider that boots before WordPress's, still runs before the query is parsed. On a REST request WordPress answers and exits, so a `booted()` callback registered from an application provider's `boot()` never runs (it did not before either).

## Also in this release

Internal quality work in the framework (type coverage and static analysis), with nothing to do on a project.

## Upgrade

```bash
composer update pollora/framework
```

A new project created from the skeleton v13.44.1 installs the framework 13.44.1.
