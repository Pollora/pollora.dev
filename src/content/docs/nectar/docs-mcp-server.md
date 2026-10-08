---
title: Docs MCP Server
description: "Connect Claude, Cursor, VS Code or Codex to the Pollora documentation through a remote MCP server, so your assistant searches and reads the current docs."
sidebar:
  order: 2
---

The Pollora documentation is available as a remote [MCP](https://modelcontextprotocol.io) server at `https://pollora.dev/mcp`. Once you add it to your AI assistant, the assistant can search these docs and read whole pages while it answers, instead of relying on what its training remembers about Pollora.

It needs no account and no project: it works in any editor or chat app that supports remote MCP servers, even before you install Pollora.

## Docs server or Nectar?

The two are complementary:

| | Docs MCP server | [Nectar](/nectar/overview/) |
| --- | --- | --- |
| Runs | On pollora.dev | In your project (`php artisan nectar:mcp`) |
| Knows | The documentation | Your application: routes, hooks, post types, versions |
| Install | Add a URL | `composer require pollora/nectar --dev` |
| Use it to | Learn an API, find the right attribute, follow a guide | Write code that fits the project you are working on |

In a Pollora project, add both.

## Add it to your assistant

You can also connect it from any docs page: open the menu next to **Copy page**.

### Claude Code

```bash
claude mcp add --transport http pollora-docs https://pollora.dev/mcp
```

Add `--scope project` to save it in the project's `.mcp.json` and share it with your team.

### Claude (web and desktop)

In **Settings › Connectors**, choose **Add custom connector**, name it `Pollora docs` and enter `https://pollora.dev/mcp`.

### Cursor

[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=pollora-docs&config=eyJ1cmwiOiJodHRwczovL3BvbGxvcmEuZGV2L21jcCJ9) in one click, or add it to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

```json
{
    "mcpServers": {
        "pollora-docs": {
            "url": "https://pollora.dev/mcp"
        }
    }
}
```

### VS Code

[Add to VS Code](vscode:mcp/install?%7B%22name%22%3A%22pollora-docs%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fpollora.dev%2Fmcp%22%7D) in one click, or add it to `.vscode/mcp.json`:

```json
{
    "servers": {
        "pollora-docs": {
            "type": "http",
            "url": "https://pollora.dev/mcp"
        }
    }
}
```

### Codex

In `~/.codex/config.toml`:

```toml
[mcp_servers.pollora-docs]
url = "https://pollora.dev/mcp"
```

### Other clients

Any client that supports remote MCP servers over Streamable HTTP can use `https://pollora.dev/mcp`. No authentication is needed.

## Tools

The server exposes three read-only tools:

| Tool | What it does |
| --- | --- |
| `search_docs` | Full-text search. Returns the best matching sections, each with its URL (down to the heading) and an excerpt. |
| `get_page` | Returns a whole page as Markdown, from its path (`routing/controllers`) or its URL. |
| `list_pages` | Lists every page by section, with its path and summary. |

Ask your assistant a question about Pollora and it calls them on its own. To make sure it does, mention it: "check the Pollora docs".

The server answers from the documentation deployed on pollora.dev, so it follows each docs update.

## Without MCP

Every docs page also exists as plain Markdown: add `.md` to its path, for example [`/routing/controllers.md`](/routing/controllers.md). The **Copy page** button copies that version, ready to paste into a chat.

For the whole documentation in one file, use [`/llms-full.txt`](/llms-full.txt), or [`/llms.txt`](/llms.txt) for the index.
