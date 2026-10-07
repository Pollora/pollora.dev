---
title: "Pollora 13.34: the first stable release"
description: Eleven pre-releases later, Pollora is stable. It moves to Laravel 13.34, ships a command that finds the failures that stay silent, and adds a Full Site Editing theme to start from.
date: 2026-09-30
category: release
version: 13.34.0
---

Two weeks ago we opened the public beta. Ten more pre-releases followed, each one fixing what real projects ran into. Today, `v13.34.0` is the first stable release of Pollora, built on Laravel 13.34.

The changelog keeps naming every change a project might notice. Features marked **experimental** in the documentation may still change shape, and they say so on their page.

## `pollora:doctor`, for the failures that stay silent

The bugs that cost the most time are not the ones that crash. They are the ones where the site renders, every command exits 0, and something is quietly wrong: a core patch Composer skipped, a theme build written to a folder nobody reads, a class added since the discovery cache was built. We met each of them in practice, so we wrote a command that looks for all of them.

```bash
php artisan pollora:doctor
```

```text
  ✓ WordPress core patch — The core is patched, and __() is Pollora's.
  ✗ Composer patches lock — patches.lock.json is older than the framework's patches.
      → composer patches-relock && composer patches-repatch
  ! Theme pattern files — 1 pattern file(s) are never registered by WordPress.
      patterns/masthead.html: WordPress reads only .php files in patterns/

  1 error(s), 1 warning(s).
```

Under each problem, it prints the command that fixes it. It checks the environment file, configuration and route caches left on outside production, theme, plugin and module builds, symlinked directories, leftover template placeholders, pattern files, and `Route::wp()` routes answering in place of a block theme's templates.

It exits with `1` when it finds an error, so it can gate a deploy or a CI job, and `--json` prints the same for scripts:

```yaml title=".github/workflows/deploy.yml"
- name: Check the project
  run: php artisan pollora:doctor
```

The same checks appear in **Tools › Site Health**, with a *Pollora* badge, plus one only a web request can make: that every block of the theme, the plugins and the modules is actually registered for a visitor.

## A third theme: Magazine

`pollora:make:theme` now offers three starting points. Next to **Starter** and **E-commerce** comes **Magazine** (`pollora/theme-buzz`), a Full Site Editing block theme: its templates, parts and patterns are edited in the Site Editor, and its PHP code still lives in classes with attributes.

```bash
php artisan pollora:make:theme
```

The command now activates the generated theme only where the site needs one. On a first install it does so without asking; on a site that already has a theme, the default answer is "no".

## Under the hood

- **Laravel 13.34.** The full test suite, Pint, PHPStan and Rector pass unchanged on it.
- **Vite scripts are script modules.** They are enqueued with `wp_enqueue_script_module()`, so WordPress places them after its import map, in the head of a block theme.
- **Route context on every route.** A `RouteMatched` listener replaces the `WordPressBodyClass` middleware, so a route WordPress answers keeps its body classes wherever it is declared.

## Upgrading from a beta

A project created during the beta updates with Composer:

```bash
composer update pollora/framework
php artisan pollora:doctor
```

Running the doctor afterwards is the point: it is the fastest way to know whether anything from the beta days is still lying around. The [changelog](/changelog/) lists every change since `13.32.0-beta`.

Thank you to everyone who installed a beta, opened an issue or simply told us what felt wrong. Pollora is better for it.
