---
title: "Pollora 13.40: pollora new finishes with the E-commerce template"
description: "On a first install, pollora new stopped with an arsort() error as soon as the E-commerce template activated WooCommerce, then exited with an error after building the theme. 13.40.1 and 13.40.2 activate plugins and theme in a fresh process, and the install ends with its success message."
date: 2026-11-06
category: release
version: 13.40.2
---

`pollora new` with the E-commerce template (`pollora/theme-apiary`) stopped with `arsort(): Argument #1 ($array) must be of type array, null given`, on a fresh project, every time. [The issue](https://github.com/Pollora/pollora/issues/274) came with the diagnosis. 13.40.1 fixed the first crash, 13.40.2 the second one behind it. Both come from the same place.

13.40.0, on 4 November, only moves the framework to Laravel 13.40 (`illuminate/*` `^13.40`).

## What failed

On a first install, `pollora:make:theme` runs in the process that has just installed WordPress. That process is only partly loaded (`SHORTINIT`): no `plugins_loaded`, no `init`. Two calls the install made there cannot work in it.

- **Activating the plugins the theme requires.** The E-commerce template requires WooCommerce. `activate_plugin()` called `plugin_basename()`, which ran `arsort()` on a value WordPress had not set yet. The install stopped before the theme build, with WooCommerce, the theme and its assets all missing.
- **Activating the theme.** Once the first crash was gone, `switch_theme()` failed with `Call to undefined function wp_set_template_globals()`. The theme was active, the install exited with code 1 and never printed its success message.

## What changed

Each activation now runs in a fresh process, where WordPress loads completely and the activation hooks run:

- **`pollora:plugin:activate`** (13.40.1) takes plugins as paths relative to the plugins directory, such as `woocommerce/woocommerce.php`.
- **`pollora:theme:activate`** (13.40.2) takes a theme by its directory name.

Both refuse to run when WordPress is not fully loaded, and you can call them yourself, for example in a deploy script.

If an activation process fails, the install carries on and prints the command to run afterwards: `wp plugin activate <slug>` or `wp theme activate <name>`. A failure there no longer costs you the theme build or the success message.

## Upgrade

```bash
composer update
```

A project that is already installed has nothing to migrate: the change only affects `pollora new` and the commands it calls. If a first install ended in an error before, create the project again with `pollora new`, or activate what it left inactive:

```bash
wp plugin activate woocommerce
wp theme activate shop
```
