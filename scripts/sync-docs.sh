#!/bin/bash
# Sync documentation from Pollora/documentation repo into Starlight content
# Usage: npm run sync-docs [path-to-doc-repo]

DOC_REPO="${1:-$HOME/Sites/pollora-documentation}"
CONTENT_DIR="$(dirname "$0")/../src/content/docs"
# "Edit page" links point at the source repo: edits made here would be overwritten by the next sync
EDIT_BASE="https://github.com/Pollora/documentation/edit/main"

if [ ! -d "$DOC_REPO" ]; then
  echo "Error: Documentation repo not found at $DOC_REPO"
  exit 1
fi

echo "Syncing docs from $DOC_REPO..."

# Link rewriting: map flat repo filenames → Starlight paths
rewrite_links() {
  local text="$1"
  # Map source filenames to Starlight URL paths (handles optional #anchor)
  echo "$text" | sed \
    -e 's|(getting-started\.md\(#[^)]*\)\?)|(/getting-started/installation/\1)|g' \
    -e 's|(installation\.md\(#[^)]*\)\?)|(/getting-started/configuration/\1)|g' \
    -e 's|(ide\.md\(#[^)]*\)\?)|(/getting-started/ide-setup/\1)|g' \
    -e 's|(environment-management\.md\(#[^)]*\)\?)|(/getting-started/environment/\1)|g' \
    -e 's|(discovery\.md\(#[^)]*\)\?)|(/core-concepts/auto-discovery/\1)|g' \
    -e 's|(wordpress-config\.md\(#[^)]*\)\?)|(/core-concepts/wordpress-config/\1)|g' \
    -e 's|(routing\.md\(#[^)]*\)\?)|(/routing/wordpress-routes/\1)|g' \
    -e 's|(controllers\.md\(#[^)]*\)\?)|(/routing/controllers/\1)|g' \
    -e 's|(middleware\.md\(#[^)]*\)\?)|(/routing/middleware/\1)|g' \
    -e 's|(post-types\.md\(#[^)]*\)\?)|(/content/post-types/\1)|g' \
    -e 's|(post-types-reference\.md\(#[^)]*\)\?)|(/content/post-types-reference/\1)|g' \
    -e 's|(taxonomies\.md\(#[^)]*\)\?)|(/content/taxonomies/\1)|g' \
    -e 's|(meta\.md\(#[^)]*\)\?)|(/content/typed-meta/\1)|g' \
    -e 's|(options\.md\(#[^)]*\)\?)|(/content/options/\1)|g' \
    -e 's|(hooks\.md\(#[^)]*\)\?)|(/hooks/actions-filters/\1)|g' \
    -e 's|(events-listeners\.md\(#[^)]*\)\?)|(/hooks/events-listeners/\1)|g' \
    -e 's|(wordpress-events-reference\.md\(#[^)]*\)\?)|(/hooks/wordpress-events-reference/\1)|g' \
    -e 's|(theming\.md\(#[^)]*\)\?)|(/theming/theme-structure/\1)|g' \
    -e 's|(assets\.md\(#[^)]*\)\?)|(/theming/assets-vite/\1)|g' \
    -e 's|(menu\.md\(#[^)]*\)\?)|(/theming/menus/\1)|g' \
    -e 's|(blocks\.md\(#[^)]*\)\?)|(/blocks/gutenberg-blocks/\1)|g' \
    -e 's|(patterns\.md\(#[^)]*\)\?)|(/blocks/patterns/\1)|g' \
    -e 's|(server-configuration\.md\(#[^)]*\)\?)|(/getting-started/server-configuration/\1)|g' \
    -e 's|(translations\.md\(#[^)]*\)\?)|(/core-concepts/translations/\1)|g' \
    -e 's|(abilities\.md\(#[^)]*\)\?)|(/advanced/abilities/\1)|g' \
    -e 's|(wp-rest-api\.md\(#[^)]*\)\?)|(/advanced/rest-api/\1)|g' \
    -e 's|(schedule-events\.md\(#[^)]*\)\?)|(/advanced/scheduling/\1)|g' \
    -e 's|(modules\.md\(#[^)]*\)\?)|(/advanced/modules/\1)|g' \
    -e 's|(auth\.md\(#[^)]*\)\?)|(/advanced/authentication/\1)|g' \
    -e 's|(roles\.md\(#[^)]*\)\?)|(/advanced/roles-capabilities/\1)|g' \
    -e 's|(ajax\.md\(#[^)]*\)\?)|(/advanced/ajax/\1)|g' \
    -e 's|(dashboard\.md\(#[^)]*\)\?)|(/advanced/dashboard/\1)|g' \
    -e 's|(wordpress-logging\.md\(#[^)]*\)\?)|(/advanced/logging/\1)|g' \
    -e 's|(wp-cli-commands\.md\(#[^)]*\)\?)|(/advanced/wp-cli/\1)|g' \
    -e 's|(plugins\.md\(#[^)]*\)\?)|(/advanced/plugins/\1)|g' \
    -e 's|(nectar\.md\(#[^)]*\)\?)|(/nectar/overview/\1)|g' \
    | sed -e 's|\[blocks\.md\]|[Gutenberg Blocks]|g' \
          -e 's|\[assets\.md\]|[Assets & Vite]|g'
}

sync_file() {
  local src="$1" target="$2" title="$3" desc="$4" order="$5"
  local src_path="$DOC_REPO/$src"
  local target_path="$CONTENT_DIR/$target"

  if [ ! -f "$src_path" ]; then
    echo "  SKIP: $src (not found)"
    return
  fi

  mkdir -p "$(dirname "$target_path")"

  # Read source, skip the first H1 heading line, rewrite links
  local content
  content=$(sed '1{/^# /d}' "$src_path")
  content=$(rewrite_links "$content")

  # Write with frontmatter
  cat > "$target_path" << EOF
---
title: ${title}
description: "${desc}"
editUrl: ${EDIT_BASE}/${src}
sidebar:
  order: ${order}
---

${content}
EOF

  echo "  OK: $src -> $target"
}

# Getting Started
sync_file "getting-started.md" "getting-started/installation.md" "Installation" "Install Pollora, the Laravel framework for WordPress, with the Pollora CLI or Composer, run the WordPress setup and check that your new project works." 1
sync_file "installation.md" "getting-started/configuration.md" "Configuration" "Configure a new Pollora project: environment variables, database, WordPress settings, local environments such as DDEV, and fixes for common setup issues." 2
sync_file "ide.md" "getting-started/ide-setup.md" "IDE Setup" "Set up PhpStorm or Visual Studio Code for a Pollora project so that autocompletion and code navigation work across your Laravel and WordPress code." 3
sync_file "environment-management.md" "getting-started/environment.md" "Environment Management" "Detect and manage environments in Pollora, from local to staging and production, with one API that works in both WordPress and Laravel contexts." 4
sync_file "server-configuration.md" "getting-started/server-configuration.md" "Server Configuration" "Serve a Pollora site with Apache or Nginx: the document root, protection against directory browsing, and HTTPS when running behind a reverse proxy." 5

# Core Concepts
sync_file "discovery.md" "core-concepts/auto-discovery.md" "Auto-Discovery" "How Pollora auto-discovery scans your code and registers hooks, post types, routes and other components, with caching and custom discovery classes." 1
sync_file "wordpress-config.md" "core-concepts/wordpress-config.md" "WordPress Configuration" "Manage WordPress constants from Laravel configuration in Pollora: publish config/wordpress.php, then set authentication keys, multisite and caching." 2
sync_file "translations.md" "core-concepts/translations.md" "Translations" "How Pollora routes __() between the Laravel and WordPress translation catalogues, which locale is used, and when to choose .po/.mo or Laravel files." 3

# Routing
sync_file "routing.md" "routing/wordpress-routes.md" "WordPress Routes" "Route WordPress pages with Laravel in Pollora: Route::wp() conditions, the template hierarchy as a fallback, and API routes for themes and plugins." 1
sync_file "controllers.md" "routing/controllers.md" "Controllers" "Write Laravel controllers for WordPress routes in Pollora: create them, attach them to Route::wp() routes and inject services through their constructor." 2
sync_file "middleware.md" "routing/middleware.md" "Middleware" "Filter requests to WordPress routes with Laravel middleware in Pollora: the built-in middleware, writing your own, and grouping middleware together." 3

# Content
sync_file "post-types.md" "content/post-types.md" "Post Types" "Declare WordPress custom post types in Pollora with a PHP 8 attribute on a class: labels, supported features, archives and translations, all in one place." 1
sync_file "post-types-reference.md" "content/post-types-reference.md" "Post Type Attributes Reference" "Every PHP attribute for Pollora post types: visibility, archives, supported features, admin UI, labels, capabilities, REST API, feeds and export settings." 2
sync_file "taxonomies.md" "content/taxonomies.md" "Taxonomies" "Declare WordPress custom taxonomies in Pollora with PHP 8 attributes on a class, and attach them to your post types without calling register_taxonomy." 3
sync_file "meta.md" "content/typed-meta.md" "Typed Meta" "Declare WordPress meta once in Pollora, as typed PHP properties with #[Meta]: register_meta(), sanitization, REST schema and typed reads and writes." 4
sync_file "options.md" "content/options.md" "Options" "Read and write WordPress options in Pollora through a fluent API, with defaults, error handling, testing and a migration path from get_option." 5

# Hooks & Events
sync_file "hooks.md" "hooks/actions-filters.md" "Actions & Filters" "Register WordPress actions and filters in Pollora with PHP 8 attributes or the Action and Filter facades, including deferred callbacks and service access." 1
sync_file "events-listeners.md" "hooks/events-listeners.md" "Events & Listeners" "Listen to WordPress actions and filters as typed Laravel events in Pollora, and use standard Laravel listeners and subscribers inside a WordPress site." 2
sync_file "wordpress-events-reference.md" "hooks/wordpress-events-reference.md" "WordPress Events Reference" "Complete list of the Laravel events Pollora dispatches for WordPress core and supported plugins, with the class to listen to for each of them." 3

# Theming
sync_file "theming.md" "theming/theme-structure.md" "Theme Structure" "Create a Pollora theme: folder structure, theme.json, Blade templates and the template hierarchy, Vite and Tailwind CSS, localization and the login screen." 1
sync_file "assets.md" "theming/assets-vite.md" "Assets & Vite" "Build theme and plugin assets with Vite in Pollora: asset containers, the Vite integration, and how to reference the compiled CSS and JavaScript files." 2
sync_file "menu.md" "theming/menus.md" "Menus" "Customize WordPress menus in Pollora with rule-based classes and attributes by depth and position, made for Tailwind CSS and Alpine.js markup." 3

# Blocks
sync_file "blocks.md" "blocks/gutenberg-blocks.md" "Gutenberg Blocks" "Build custom Gutenberg blocks in Pollora with Vite and JSX, scaffold them with pollora:make:block, and render them on the server with Blade templates." 1
sync_file "patterns.md" "blocks/patterns.md" "Block Patterns" "Register WordPress block patterns in Pollora: configuration, how to organize pattern files, writing patterns, and how they are loaded automatically." 2

# Advanced
sync_file "wp-rest-api.md" "advanced/rest-api.md" "REST API" "Build WordPress REST API endpoints in Pollora with the WpRestRoute attribute: define routes and methods, and control access with permission classes." 1
sync_file "abilities.md" "advanced/abilities.md" "Abilities" "Declare WordPress abilities in Pollora with an attribute or a facade, with permissions and input schemas, so AI agents and MCP clients can use your site." 2
sync_file "schedule-events.md" "advanced/scheduling.md" "Scheduling" "Schedule recurring WordPress tasks in Pollora with PHP attributes: the Every enum, custom intervals, hook names and arguments, without WP-Cron boilerplate." 3
sync_file "modules.md" "advanced/modules.md" "Modules" "Organize a Pollora project with Laravel Modules: when to choose a module over a WordPress plugin, and how to create, enable and auto-discover modules." 4
sync_file "auth.md" "advanced/authentication.md" "Authentication" "Use Laravel's Auth facade with WordPress users in Pollora: the WordPress guard lets the standard Auth methods work against WordPress accounts." 5
sync_file "roles.md" "advanced/roles-capabilities.md" "Roles & Capabilities" "Check WordPress capabilities with Laravel in Pollora — can(), the can: middleware, @can — and declare roles in code with #[Role] and #[ModifyRole]." 6
sync_file "ajax.md" "advanced/ajax.md" "AJAX" "Handle WordPress AJAX requests in Pollora with an attribute or a facade, understand the security model, and call your handlers from frontend JavaScript." 7
sync_file "dashboard.md" "advanced/dashboard.md" "Dashboard & Status" "Check a Pollora installation from the WordPress admin dashboard or the CLI, see discovered components and diagnose a project with pollora:doctor." 8
sync_file "wordpress-logging.md" "advanced/logging.md" "Logging" "Log WordPress errors, warnings and deprecated function calls through Laravel logging in Pollora, so they reach your log channels without breaking pages." 9
sync_file "wp-cli-commands.md" "advanced/wp-cli.md" "WP-CLI Commands" "Create custom WP-CLI commands in Pollora with PHP attributes: single commands, subcommand suites, automatic slugs, and a generator to scaffold them." 10
sync_file "plugins.md" "advanced/plugins.md" "Plugin Development" "Build WordPress plugins with Pollora: scaffold them from the CLI, then use service providers, attribute-based hooks, autoloading and Vite assets." 11

# Nectar AI
sync_file "nectar.md" "nectar/overview.md" "Overview" "Nectar gives AI coding agents Pollora context: an MCP server and its tools, AI guidelines and agent skills built on Laravel Boost, plus upgrade help." 1

echo ""
echo "Done! Sync complete."
echo "Run 'npm run build' to verify."
