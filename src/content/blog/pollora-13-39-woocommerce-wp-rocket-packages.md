---
title: "Pollora 13.39: WooCommerce and WP Rocket become packages"
description: "The framework no longer ships its WooCommerce and WP Rocket integrations: pollora/woocommerce and pollora/wp-rocket carry them. A project that runs either plugin has one command to run, and pollora:doctor tells you when it is missing."
date: 2026-10-29
category: release
version: 13.39.1
---

Two integrations left the framework this week. 13.39.0 (27 October) moved WooCommerce to [`pollora/woocommerce`](https://github.com/Pollora/woocommerce); 13.39.1 (29 October) moved WP Rocket to [`pollora/wp-rocket`](https://github.com/Pollora/wp-rocket) and raised the versions of Colt and Query. The framework follows Laravel, so 13.39 is built on Laravel 13.39.

The core now names no third-party plugin. Each integration is released at its own pace, and a project that does not run the plugin no longer carries its code.

## If your project runs WooCommerce or WP Rocket

Install the package. The framework does not do it for you, and **without it nothing fails loudly**:

```bash
composer require pollora/woocommerce   # a project that runs WooCommerce
composer require pollora/wp-rocket     # a project that runs WP Rocket
```

- **WooCommerce without the package** loses its Blade templates, the `Route::wp()` conditions (`shop`, `product`, `cart`, `checkout`…), the Coming Soon page and the WooCommerce events as Laravel events. Nothing reports an error.
- **WP Rocket without the package** is no longer kept from writing its cache rules into `.htaccess` and from setting `WP_CACHE` in `wp-config.php`: it does both by itself.

`php artisan pollora:doctor` and Tools › Site Health warn when WooCommerce or WP Rocket is active and its package is missing, and print the `composer require` line.

## What you do not have to change

- **Class names.** The old `Pollora\ThirdParty\WooCommerce\…` and `Pollora\ThirdParty\WpRocket\WpRocketServiceProvider` names keep resolving once the package is installed, aliased to `Pollora\WooCommerce\…` and `Pollora\WpRocket\…`. They are removed in the next major release.
- **Configuration.** `wordpress.wprocket` is unchanged, and the `Route::wp()` conditions you set in `wordpress.plugin_conditions` still win over the package's defaults.
- **Behaviour.** The packages bring the same integration: the pages are [WooCommerce](https://pollora.dev/advanced/woocommerce/) and [WP Rocket](https://pollora.dev/advanced/wp-rocket/).

A new project made with `pollora:make:theme` and the `apiary` storefront theme is offered `pollora/woocommerce` along the way.

## The versions that moved with it

13.39.1 requires these, and `composer update` brings them:

| Package | Version | What changed |
| --- | --- | --- |
| [`pollora/colt`](https://github.com/Pollora/colt/releases/tag/11.0.0) | 11 | Requires PHP 8.3, `declare(strict_types=1)` everywhere, return types on public methods, and two traits removed (`AdvancedCustomFields`, `ResetsPasswords`) |
| [`pollora/query`](https://github.com/Pollora/Query/releases/tag/3.0.0) | 3 | Requires PHP 8.3; no query changed. The framework accepts `^2.0 || ^3.0` |
| `pollora/block-bindings` | 0.2 | Needs Colt 11 |

Colt is the one to read before updating. A model that extends one of Colt's and overrides a method must use a compatible return type, and a scalar of the wrong type passed to a typed parameter now throws a `TypeError` instead of being converted. If you used one of the two removed traits, the [release notes](https://github.com/Pollora/colt/releases/tag/11.0.0) say what replaces it.

## Upgrade

```bash
composer update
php artisan pollora:doctor
```

1. Run PHP 8.3 or later (the framework already requires it).
2. Install `pollora/woocommerce` and `pollora/wp-rocket` if the project runs those plugins.
3. If your code extends a Colt model, check the methods it overrides against the [Colt 11 notes](https://github.com/Pollora/colt/releases/tag/11.0.0).
4. Run `pollora:doctor`: it reports a missing package.

The framework's own checks moved too: the [Pollora harness](https://github.com/Pollora/harness) now blocks a merge on a failing gate. Nothing changes at run time.
