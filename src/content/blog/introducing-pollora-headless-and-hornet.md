---
title: "Meet Hornet and Headless: secure your WordPress, or take its front away"
description: "Two new packages that work on a classic WordPress, on Bedrock and on Pollora. Hornet audits a site and tells you what to fix. Headless prepares WordPress to serve a JavaScript front end."
metaDescription: "Hornet audits and hardens WordPress; Headless turns it into a back end for any front end. Both work on classic installs, Bedrock and Pollora."
date: 2026-11-27
category: announcement
---

Two packages join Pollora, and neither requires it. Both run on a classic WordPress, on Bedrock and inside a Pollora project, on PHP 8.3 or later.

## Hornet: security you can read

Hornet audits the configuration of a site, says what to fix and how, and gives it a score. The same findings show in **Tools > Security**, in Site Health, in WP-CLI and, on Pollora, in `php artisan pollora:doctor`.

**By default it changes nothing.** It reads and it tells you. Hardening and security headers do nothing until you turn each one on.

- **Checks** on keys and salts, debug settings, HTTPS, file permissions, updates, accounts and two-factor, plus `APP_KEY` and Debugbar on Pollora.
- **A scan** that compares core and plugin files with WordPress.org, looks for scripts where none belong, for disguised JavaScript in the database, and for files your site gives away.
- **Protections to opt into**: hardening, headers and Content-Security-Policy, a login throttle, breached passwords, session length, a two-factor gate, a REST API closed to visitors.
- **A journal** of who logged in, what was installed and which settings changed, off until you turn it on.
- **Notifications** by mail, Slack, Teams, Discord, Telegram, ntfy or a signed webhook.

It also knows its place: on a site protected by [Portcullis](https://github.com/Pollora/portcullis), it does not add a second login guard.

### What it costs a request

We measured it rather than assume it, on a fresh WordPress with OPcache. With the default settings, the time added to a front page is under 0.4 ms, which is within the noise of the measure, with no extra SQL query. With every protection on, it stays under 0.6 ms on pages and adds 7 to 9 ms to a refused login. The [method and the full table](https://github.com/Pollora/hornet#what-it-costs) say what was not measured.

### Know before you install

- Hornet is **0.x**: settings, commands and hooks can still change before 1.0.
- **It is not a firewall.**
- Translations are machine-made.
- The scan sends the folder name of each plugin to `api.wordpress.org`, to tell whether it was closed or abandoned. `'disabled_checks' => ['abandoned-plugins']` stops it.

```bash
composer require pollora/hornet
wp hornet status
```

On a classic WordPress there is one more step, a small loader to copy: see the [documentation](/advanced/security/). Start with 0.10.1 or later: it fixes a scan that could stay stuck in earlier versions.

## Headless: WordPress as the back end

A headless project usually starts with the same list of chores: hide the public front, remove what nothing uses, fix CORS, secure the API, make previews work, tell the front end when content changes. Headless does that list.

- **A front gate** redirects public pages to your front end, and links, feeds and "View post" point there too.
- **A safer, faster API**: CORS for the origins you list, user routes closed to visitors, cache headers and `ETag` on public answers, scoped API tokens.
- **Preview** of drafts and scheduled posts from your own front end, with a one-time token.
- **Revalidation**: a signed webhook when content changes, merged and retried.
- **Ready-made data**: a site manifest with menus, redirects, media with focal points, blocks as stable JSON, and SEO metadata in one shape.
- **GraphQL**, optional: if you run WPGraphQL, it is made safe for a public site.

Any front end that speaks HTTP works with it: Next.js, Nuxt, Astro, SvelteKit or your own. No client library is needed, and the [HTTP contract](https://github.com/Pollora/headless/blob/main/docs/HTTP-CONTRACT.md) follows semantic versioning from 1.0.

Nothing changes on the public site until you set the address of your front end.

### Know before you install

- The WPML support is covered by unit tests only.
- The Rank Math, All in One SEO and SEOPress adapters have not been run against the plugins themselves.
- Contact Form 7 is the only form plugin supported so far.

```bash
composer require pollora/headless
```

Setup is described in the [README](https://github.com/Pollora/headless#readme).

## Tell us what breaks

Both packages are young. Issues and pull requests are welcome on [Pollora/hornet](https://github.com/Pollora/hornet) and [Pollora/headless](https://github.com/Pollora/headless).
