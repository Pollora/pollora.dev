---
title: AI coding agents for WordPress projects
description: "Give Claude Code, Cursor, Copilot or Codex accurate context on a WordPress codebase with Laravel Boost and Nectar: guidelines, agent skills, MCP tools."
sidebar:
  order: 3
---

Coding agents such as Claude Code, Cursor, GitHub Copilot or Codex write code from their training and from what they can read in your project. On a WordPress codebase, both are often thin. This guide explains how [Laravel Boost](https://laravel.com/docs/boost) and [Nectar](/nectar/overview/) give an agent working on a Pollora project the context it is missing.

This is not about the "WordPress MCP" servers that let an assistant create posts or edit pages on a live site. Those work on content. Boost and Nectar work on code: how your application is built, inspected while you develop.

## Why agents get WordPress wrong

A few properties of WordPress make it hard to infer from source code alone:

- **Global state.** Much of WordPress is global functions and global variables (`$post`, `$wp_query`). What a template can rely on depends on where in the request it runs, which the code does not say.
- **Hooks registered at runtime.** Behaviour is attached with `add_action()` and `add_filter()` from the theme, from plugins and from core. Reading your theme does not show which filters a plugin adds, or which post types exist once every plugin has loaded.
- **Many eras of documentation.** Tutorials for the classic editor, the block editor, `functions.php` snippets and different PHP versions coexist on the web. An agent has no reliable way to tell which one matches your project.

On a Pollora project there is one more gap: Pollora registers post types, taxonomies and hooks with PHP attributes and routes WordPress pages with `Route::wp()`. An agent that has not seen these conventions falls back on plain WordPress code (`register_post_type()` in `functions.php`), which works against the framework.

## How Laravel Boost works

Boost is Laravel's package for AI-assisted development. It gives an agent three kinds of context ([Boost documentation](https://laravel.com/docs/13.x/boost)):

- **AI guidelines.** Instruction files loaded upfront, when the agent starts, with the conventions of the packages you use. `boost:install` writes them into the files your agents read (`CLAUDE.md`, `AGENTS.md` and so on).
- **Agent skills.** Focused modules, each a `SKILL.md` file, that the agent loads on demand when it works on a matching task.
- **An MCP server.** Tools the agent can call to inspect the running application: application info, database connections, schema and queries, log entries, the last error, browser logs, absolute URLs, project rules, and `Search Docs`, which queries Laravel's hosted documentation API for your installed package versions.

Boost lists set-up steps for Cursor, Claude Code, Codex, Gemini CLI, GitHub Copilot (VS Code) and Junie. Third-party packages can ship their own guidelines in `resources/boost/guidelines/` and skills in `resources/boost/skills/`; Boost installs them alongside its own. Nectar uses that mechanism.

Boost knows Laravel. It has no WordPress guidelines or skills, and its documentation API covers Laravel ecosystem packages, not WordPress.

## What Nectar adds

[Nectar](https://github.com/Pollora/Nectar) (`pollora/nectar`) is a Boost extension for Pollora projects. It adds the WordPress and Pollora side.

### Guidelines

Loaded upfront through Boost, they describe Pollora's architecture (Laravel routes first, the WordPress template hierarchy as fallback, Blade only), the registration attributes (`#[PostType]`, `#[Taxonomy]`, `#[Action]`, `#[Filter]`, `#[Schedule]`, `#[WpRestRoute]`, `#[Ajax]`, `#[Ability]`, `#[SkipDiscovery]`), `Route::wp()`, Sage Directives in Blade, theme structure and the Artisan commands. A key rule they state: never call WordPress registration functions directly, use attributes and discovery. The guideline text is picked from your installed framework major (12.x or 13.x).

### Agent skills

Nine skills, loaded when the task matches:

| Skill | Covers |
|-------|--------|
| `pollora-post-types` | Custom post types with `#[PostType]` |
| `pollora-taxonomies` | Custom taxonomies with `#[Taxonomy]` |
| `pollora-theming` | Blade or block themes, Vite, Tailwind CSS, theme.json |
| `pollora-hooks` | Actions and filters with attributes or facades |
| `pollora-blocks` | Gutenberg blocks with JSX/TSX and Blade rendering |
| `pollora-rest-api` | REST endpoints with `#[WpRestRoute]`, AJAX with `#[Ajax]` |
| `pollora-scheduling` | Recurring tasks with `#[Schedule]` and WordPress cron |
| `pollora-modules` | Laravel Modules (nwidart) with discovery |
| `pollora-abilities` | The WordPress Abilities API with `#[Ability]` |

### MCP tools

Nectar runs its own MCP server, `pollora-nectar`, next to Boost's. Its ten tools read the live environment, which is the part static code cannot show:

| Tool | Returns |
|------|---------|
| `pollora_status` | PHP, Laravel, Pollora and WordPress versions, active theme, discovery cache status, installed Pollora packages |
| `wordpress_info` | WordPress version, site URL, active and inactive plugins, active and parent theme, multisite, key constants, locale, permalink structure |
| `post_types_info` | Registered post types and their configuration |
| `taxonomies_info` | Registered taxonomies and their configuration |
| `registered_hooks` | Hooks discovered from `#[Action]` and `#[Filter]`, with class, method and priority |
| `active_theme_info` | Theme structure, providers, blocks, Blade templates, Vite and theme.json status |
| `discovered_components` | All auto-discovered components, grouped by type |
| `wordpress_routes` | Routes, including `Route::wp()` conditions |
| `modules_info` | Installed Laravel Modules and their status |
| `wp_option` | One WordPress option value by key |

Every tool is marked read-only: none of them changes the application.

### Upgrade prompts

Nectar also exposes MCP prompts that walk an agent through a Pollora upgrade step by step. Each registers only when the installed framework version matches:

- `upgrade-pollora-v13`, for projects on Pollora 12.x moving to 13.
- `upgrade-pollora-v13-32`, for projects on 13.0 up to, but not including, 13.32. It covers the dependency changes, `cweagans/composer-patches` 2, renamed Artisan commands, extracted packages, blocks, skeleton files and theme changes.

## Install and configure

Nectar requires Laravel Boost, so one Composer command installs both:

```bash
composer require pollora/nectar --dev
```

Then let Boost write the guidelines and skills for your agents:

```bash
php artisan boost:install
```

Select `pollora/nectar` when Boost asks about third-party packages, or add it to `boost.json` and update:

```json
{
    "packages": ["pollora/nectar"]
}
```

```bash
php artisan boost:update
```

Register the Nectar MCP server in the project's `.mcp.json`, next to the `laravel-boost` entry Boost creates:

```json
{
    "mcpServers": {
        "pollora-nectar": {
            "command": "php",
            "args": ["artisan", "nectar:mcp"]
        }
    }
}
```

In a DDEV project, run the server inside the container instead:

```json
{
    "mcpServers": {
        "pollora-nectar": {
            "command": "ddev",
            "args": ["exec", "php", "artisan", "nectar:mcp"]
        }
    }
}
```

For an agent that does not read `.mcp.json`, register the same command (`php`, arguments `artisan nectar:mcp`) in its MCP settings. After a `composer update`, run `php artisan boost:update` again to refresh guidelines and skills; `--discover` also offers those of newly installed packages.

Nectar loads only when `APP_ENV` is `local` or `development`. Set `NECTAR_ENABLED=false` to turn it off locally.

## Example prompts

With guidelines, skills and tools in place, prompts can stay short:

- *"Add an `event` post type with a `venue` taxonomy and show it in the REST API."* The post-types and taxonomies skills point the agent to attribute classes such as `#[PostType('event')]` and `#[ShowInRest]` instead of `register_post_type()`. It can then call `post_types_info` to check that the type is registered.
- *"Why doesn't my filter on `the_content` run?"* The agent can list discovered hooks with `registered_hooks`, compare priorities, and check which plugins are active with `wordpress_info`.
- *"Render single events with a controller."* The guidelines describe `Route::wp('single', ...)`; `wordpress_routes` shows which routes already exist.
- *"Create a hero block with inner blocks."* The blocks skill describes the `resources/views/blocks` layout, `render.blade.php` and `<InnerBlocks />`.
- On a 13.4 project, ask the agent to use the `upgrade-pollora-v13-32` prompt to plan the upgrade.

## Limits

- **Pollora only.** Boost runs in a Laravel application, and Nectar requires `pollora/framework`. Neither works on a standard WordPress install without Pollora.
- **Development only.** Nectar does not load in production or staging environments.
- **Read-only introspection.** Nectar's tools report state; you still review what the agent writes.
- **Discovery-based hooks.** `registered_hooks` lists hooks declared with Pollora attributes. Hooks a third-party plugin adds with `add_action()` do not appear there.
- **No WordPress documentation search.** Boost's `Search Docs` covers Laravel ecosystem packages. For WordPress core APIs, the agent relies on its training and on the code.
- **Upgrade prompts are narrow.** They exist for 12.x to 13 and for 13.0–13.31 to 13.32. A project already on 13.34 sees neither.

To start a project with this set-up, see [Installation](/getting-started/installation/). The full reference is on the [Nectar overview](/nectar/overview/) page.
