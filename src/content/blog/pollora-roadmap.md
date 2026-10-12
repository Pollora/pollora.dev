---
title: "The Pollora roadmap: smaller packages, more of WordPress, and a Pollora without Laravel"
description: "Discovery and attributes become standalone packages, blocks, menus and widgets get their APIs, each WordPress integration moves to its own package, and Pollora heads toward a mu-plugin for classic WordPress and Bedrock."
date: 2026-10-12
category: roadmap
---

Pollora now has a [roadmap page](/roadmap/). It answers a question we hear often, in issues and after talks: *where is this going?* The short answer fits in one sentence. Pollora is splitting into packages you can use on their own, filling in what it still misses of WordPress, and heading toward a version that runs without Laravel, in a classic WordPress or a Bedrock.

The roadmap starts from 13.35.5 and reads in three horizons. They are not dated: they set an order of priority, not a calendar.

## Why split the framework

Today most of Pollora lives in one package, `pollora/framework`, and that package assumes Laravel. That is fine when you start a project with `pollora new`. It is a wall when you maintain a classic theme, a plugin sold on its own, or a Bedrock stack, and you would like `#[Action]` or typed meta without moving the whole site into Laravel.

Some pieces already crossed that wall. `pollora/hook` works in a plain WordPress plugin or theme, and `pollora/helper-overrider` has no Laravel dependency at all. The roadmap makes that the rule: one package per job, a framework that assembles them, and the same code whether it runs in a Laravel application, a classic WordPress or a Bedrock.

## Short term: the foundations, and the gaps you notice first

Two extractions come first, because everything else builds on them:

- **`pollora/discovery`**, the system that finds classes carrying attributes in themes, plugins and modules. Its contracts are already a documented, stable API. It trades Laravel's cache for PSR-16 and container scanning for explicit registration that works with any PSR-11 container.
- **`pollora/attributes`**, the attribute declarations (`#[PostType]`, `#[Action]`, `#[Meta]`, `#[Schedule]` and the rest), in a package with no dependencies. A plugin can declare them without installing the framework, and an IDE or a static analyser can read them on their own.

Alongside, three everyday gaps close: **block variations and styles** (a fluent API and an attribute, `core/*` blocks included, styles served by Vite), **menus** (locations declared like post types, a Blade component to render them) and **widgets** (areas with a fluent API, a widget as a class rendered in Blade).

## Mid term: one package per WordPress integration

Once discovery and attributes stand alone, the features that mostly talk to WordPress leave the framework one by one: typed meta, Block Bindings, roles, scheduled tasks, REST routes, WP-CLI commands, assets and Vite, Blade blocks and patterns. Each has something to solve first, and the [roadmap page](/roadmap/#mid-term) lists it. For instance, `pollora/meta` has to separate the WordPress registration from the Eloquent accessors, which stay in the framework.

In parallel, Pollora covers new WordPress APIs, always in two forms, a fluent API and an attribute: allowed blocks per post type, Block Hooks, admin pages and settings, image sizes, post statuses, shortcodes, dashboard widgets and admin notices.

Third-party plugins stay out of the framework. The first companion package will be a Meta Box integration, an existing AmphiBee package that joins the Pollora organization under a new name.

## Long term: Pollora as a mu-plugin

This part is a direction, still under study. Pollora would ship as a mu-plugin that embeds the framework. The hexagonal architecture already separates ports from adapters, so each port can pick its adapter from what is present: Laravel's cache, queue, logs and Artisan in a Pollora application; transients, Action Scheduler, `debug.log` and WP-CLI in a classic WordPress. Your `#[PostType]` does not change.

Laravel routing, Eloquent, authentication and modules stay with Laravel applications. The [roadmap page](/roadmap/#long-term) has a small switch that shows which adapter answers in each environment.

One change is already scheduled: the `resources/blocks` folder is read, with a warning, until Pollora v15. Blocks belong in `resources/views/blocks`.

## Tell us what to move up

A roadmap with no dates is also a roadmap that can still change order. If one of these items would unlock a project of yours, or if something you need is missing, [open an issue](https://github.com/Pollora/framework/issues) and say why. As each piece is designed, it gets its own post here, the way [async actions](/blog/roadmap-async-actions/) did before shipping in 13.35.2.
