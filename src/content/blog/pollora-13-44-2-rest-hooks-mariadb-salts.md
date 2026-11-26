---
title: "Pollora 13.44.1 and 13.44.2: REST hooks, MariaDB and generated salts"
description: "Two releases on the same day. 13.44.1 gives REST requests the hooks your providers add, and builds the main query later: check your project before updating. 13.44.2 accepts the MariaDB driver and generates the WordPress keys and salts of a new site."
metaDescription: "Pollora 13.44.1 and 13.44.2: provider hooks on REST requests, DB_CONNECTION=mariadb, and WordPress salts generated for new sites."
date: 2026-11-26
category: release
version: 13.44.2
---

Two releases the same day. 13.44.1 fixes REST requests, and changes when WordPress builds the main query, on front-end pages too: read [what to check](#check-this-before-updating) before updating. 13.44.2 accepts Laravel's MariaDB driver and gives a new site its own keys and salts.

## REST requests get your providers' hooks (13.44.1)

WordPress answers a REST request (`/wp-json/…`, `/?rest_route=…`) while it parses the request, inside `wp()`, and exits. Pollora called `wp()` while Laravel was still booting its providers, before the application's and the theme's providers had booted. Every filter, action, binding or REST route those providers add in `boot()` was missing from REST requests: a block editor save did not fire a `save_post` hooked there, and a route registered there answered `rest_no_route`.

`wp()` now runs once every provider has booted, just before `template_redirect` and still before routing.

If you moved hooks to `register()` to work around this, you can move them back to `boot()`. If you hooked in both, you now get them twice.

[nmetahri](https://github.com/nmetahri) [reported the problem](https://github.com/Pollora/framework/issues/708) and [wrote the fix](https://github.com/Pollora/framework/pull/709): thank you.

## Check this before updating

The main query is now built after the application's and the theme's providers have booted.

- **Hooks on the main query now apply.** A `pre_get_posts`, `parse_query` or `request` hook added in a provider's `boot()` was not applied until now. It is applied now, so an existing site can show different content.
- **Reading the main query too early no longer works.** A provider that calls `is_*()` or `get_queried_object()`, or reads query vars, in its `boot()` now runs before the query is parsed. So does a route file that reads it while it is loaded. Read it from a hook such as `wp`, or inside the route.
- **A `booted()` callback is not enough.** One registered in `register()`, or by a provider that boots before WordPress's, still runs before the query is parsed. On a REST request WordPress answers and exits, so a `booted()` callback registered from an application provider's `boot()` never runs (it did not before either).

## Also in 13.44.1

Internal quality work in the framework (type coverage and static analysis), with nothing to do on a project.

## MariaDB, with Laravel's own driver (13.44.2)

Laravel has a `mariadb` driver of its own. Pollora did not count it: with `DB_CONNECTION=mariadb`, the site answered *not set up yet* and `pollora:install` failed with `Undefined constant … WPINC`. `mariadb` now works like `mysql`, and `pollora:env:setup` keeps it when your project chose it.

## Keys and salts for a new site (13.44.2)

WordPress signs its login cookies and nonces with eight keys and salts, which Pollora reads from `.env`. Nothing generated them: a new project let WordPress make its own and keep them in the database, next to the sessions they sign.

`pollora:install` now writes them to `.env` for a new site. For an existing project, run:

```bash
php artisan pollora:salts:generate
```

It writes only the missing ones and never prints a value. **On a site that is already in use, running it signs everyone out** (they log in again). `--force` replaces all eight. Without a `.env` file, set the eight variables where your platform keeps its environment variables. Composer does not run this on install or update.

13.44.2 also fixes the writing of `.env`: it looked for the file in the current directory, and could write `.env.example` over your `.env` when run from elsewhere.

## Upgrade

```bash
composer update pollora/framework
```

A new project created from the skeleton v13.44.2 installs the framework 13.44.2.
