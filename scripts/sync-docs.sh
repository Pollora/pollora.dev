#!/bin/bash
# Sync documentation from Pollora/documentation repo into Starlight content
# Usage: npm run sync-docs [path-to-doc-repo]

DOC_REPO="${1:-$HOME/Sites/pollora-documentation}"
CONTENT_DIR="$(dirname "$0")/../src/content/docs"

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
    -e 's|(options\.md\(#[^)]*\)\?)|(/content/options/\1)|g' \
    -e 's|(hooks\.md\(#[^)]*\)\?)|(/hooks/actions-filters/\1)|g' \
    -e 's|(events-listeners\.md\(#[^)]*\)\?)|(/hooks/events-listeners/\1)|g' \
    -e 's|(wordpress-events-reference\.md\(#[^)]*\)\?)|(/hooks/wordpress-events-reference/\1)|g' \
    -e 's|(theming\.md\(#[^)]*\)\?)|(/theming/theme-structure/\1)|g' \
    -e 's|(assets\.md\(#[^)]*\)\?)|(/theming/assets-vite/\1)|g' \
    -e 's|(menu\.md\(#[^)]*\)\?)|(/theming/menus/\1)|g' \
    -e 's|(blocks\.md\(#[^)]*\)\?)|(/blocks/gutenberg-blocks/\1)|g' \
    -e 's|(patterns\.md\(#[^)]*\)\?)|(/blocks/patterns/\1)|g' \
    -e 's|(wp-rest-api\.md\(#[^)]*\)\?)|(/advanced/rest-api/\1)|g' \
    -e 's|(schedule-events\.md\(#[^)]*\)\?)|(/advanced/scheduling/\1)|g' \
    -e 's|(modules\.md\(#[^)]*\)\?)|(/advanced/modules/\1)|g' \
    -e 's|(auth\.md\(#[^)]*\)\?)|(/advanced/authentication/\1)|g' \
    -e 's|(ajax\.md\(#[^)]*\)\?)|(/advanced/ajax/\1)|g' \
    -e 's|(admin-pages\.md\(#[^)]*\)\?)|(/advanced/admin-pages/\1)|g' \
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
description: ${desc}
sidebar:
  order: ${order}
---

${content}
EOF

  echo "  OK: $src -> $target"
}

# Getting Started
sync_file "getting-started.md" "getting-started/installation.md" "Installation" "Get started with Pollora in minutes" 1
sync_file "installation.md" "getting-started/configuration.md" "Configuration" "Configure your Pollora project after installation" 2
sync_file "ide.md" "getting-started/ide-setup.md" "IDE Setup" "Configure your IDE for Pollora development" 3
sync_file "environment-management.md" "getting-started/environment.md" "Environment Management" "Manage environments and context detection" 4

# Core Concepts
sync_file "discovery.md" "core-concepts/auto-discovery.md" "Auto-Discovery" "How Pollora discovers and registers components" 1
sync_file "wordpress-config.md" "core-concepts/wordpress-config.md" "WordPress Configuration" "Configure WordPress constants through Laravel" 2

# Routing
sync_file "routing.md" "routing/wordpress-routes.md" "WordPress Routes" "Hybrid routing with Route::wp() and template hierarchy" 1
sync_file "controllers.md" "routing/controllers.md" "Controllers" "Create controllers with dependency injection" 2
sync_file "middleware.md" "routing/middleware.md" "Middleware" "Filter HTTP requests and responses" 3

# Content
sync_file "post-types.md" "content/post-types.md" "Post Types" "Define custom post types with PHP 8 attributes" 1
sync_file "post-types-reference.md" "content/post-types-reference.md" "Post Type Attributes Reference" "Complete reference of all post type attributes" 2
sync_file "taxonomies.md" "content/taxonomies.md" "Taxonomies" "Define custom taxonomies with PHP 8 attributes" 3
sync_file "options.md" "content/options.md" "Options" "Manage WordPress options with a fluent API" 4

# Hooks & Events
sync_file "hooks.md" "hooks/actions-filters.md" "Actions & Filters" "Register hooks with PHP 8 attributes and facades" 1
sync_file "events-listeners.md" "hooks/events-listeners.md" "Events & Listeners" "WordPress hooks as Laravel events" 2
sync_file "wordpress-events-reference.md" "hooks/wordpress-events-reference.md" "WordPress Events Reference" "Complete catalog of WordPress and plugin events" 3

# Theming
sync_file "theming.md" "theming/theme-structure.md" "Theme Structure" "Create and manage Pollora themes" 1
sync_file "assets.md" "theming/assets-vite.md" "Assets & Vite" "Modern asset management with Vite" 2
sync_file "menu.md" "theming/menus.md" "Menus" "Menu management with rule-based configuration" 3

# Blocks
sync_file "blocks.md" "blocks/gutenberg-blocks.md" "Gutenberg Blocks" "Create custom blocks with Vite and JSX" 1
sync_file "patterns.md" "blocks/patterns.md" "Block Patterns" "Register and manage block patterns" 2

# Advanced
sync_file "wp-rest-api.md" "advanced/rest-api.md" "REST API" "Build REST endpoints with WpRestRoute attributes" 1
sync_file "schedule-events.md" "advanced/scheduling.md" "Scheduling" "Schedule recurring tasks with attributes" 2
sync_file "modules.md" "advanced/modules.md" "Modules" "Organize projects with Laravel Modules" 3
sync_file "auth.md" "advanced/authentication.md" "Authentication" "WordPress authentication guard integration" 4
sync_file "ajax.md" "advanced/ajax.md" "AJAX" "Handle AJAX requests in Pollora" 5
sync_file "admin-pages.md" "advanced/admin-pages.md" "Admin Pages" "Create WordPress admin pages" 6
sync_file "dashboard.md" "advanced/dashboard.md" "Dashboard & Status" "Monitor your Pollora application" 7
sync_file "wordpress-logging.md" "advanced/logging.md" "Logging" "WordPress error logging through Laravel" 8
sync_file "wp-cli-commands.md" "advanced/wp-cli.md" "WP-CLI Commands" "Create custom WP-CLI commands" 9
sync_file "plugins.md" "advanced/plugins.md" "Plugin Development" "Build plugins with Pollora" 10

# Nectar AI
sync_file "nectar.md" "nectar/overview.md" "Overview" "AI-powered development context for Pollora" 1

echo ""
echo "Done! Sync complete."
echo "Run 'npm run build' to verify."
