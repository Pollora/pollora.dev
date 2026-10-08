<p align="center">
  <a href="https://pollora.dev">
    <img src="https://raw.githubusercontent.com/Pollora/.github/main/brand/banners/pollora.dev.png" width="100%" alt="pollora.dev: the website of Pollora, the Laravel framework for WordPress">
  </a>
</p>

<p align="center">
  <a href="https://pollora.dev"><img src="https://img.shields.io/website?url=https%3A%2F%2Fpollora.dev&label=pollora.dev" alt="pollora.dev"></a>
</p>

This repository is the source of [pollora.dev](https://pollora.dev), the website and documentation of Pollora, the Laravel framework for WordPress. It holds the home page, the documentation pages, the release notes and the press kit. It is built with [Astro](https://astro.build) 6, [Starlight](https://starlight.astro.build) and Tailwind CSS v4, and deployed on Vercel from `main`.

> Every push to `main` deploys production. Work on a branch and open a pull request.

## Development

Requirements: Node.js 22.12+ (the floor Astro 6 requires) and npm.

```bash
npm install
npm run dev       # local server with hot reload, on http://localhost:4321
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Documentation pages

Most pages under `src/content/docs/` are copied from the [Pollora/documentation](https://github.com/Pollora/documentation) repository by the sync script:

```bash
npm run sync-docs                          # reads ~/Sites/pollora-documentation by default
npm run sync-docs -- /path/to/documentation
```

The script **overwrites** every page it maps (see `scripts/sync-docs.sh`): it adds the front matter, rewrites the links between pages and points each page's "Edit page" link at Pollora/documentation. **Fix the documentation in [Pollora/documentation](https://github.com/Pollora/documentation), never here**: a change made to a synced page is lost on the next sync.

The pages that belong to the site itself, and are edited here, are `why.md`, `compare.md`, `faq.md`, the `guides/` folder and the blog (`src/content/blog/`).

## Project structure

| Path | What it holds |
|---|---|
| `src/pages/index.astro` | The home page |
| `src/pages/changelog.astro` | The release notes, fetched from the GitHub releases of Pollora/framework at build time (set `GITHUB_TOKEN` to avoid the API rate limit) |
| `src/content/blog/`, `src/pages/blog/` | The blog: one Markdown file per post (front matter: `title`, `description`, `date`, `category` among `announcement`, `release`, `tutorial`, `roadmap`, optional `version`, `author`, `draft`), its index, category pages and RSS feed (`/blog/rss.xml`) |
| `src/pages/press.astro` | The press kit: facts, descriptions, brand assets, screenshots and code samples |
| `public/press/` | The press kit's files (logos, mascots, screenshots, `pollora-press-kit.zip`) |
| `src/content/docs/` | The documentation pages (see above) |
| `src/components/`, `src/styles/` | Starlight component overrides, analytics and consent banner, CSS |
| `astro.config.mjs` | Starlight settings: sidebar, `llms.txt`, head tags |
| `scripts/og-image.mjs` | Generates `public/og-image.png`, the fallback social preview (`node scripts/og-image.mjs`) |
| `src/pages/og/[...slug].png.ts` | One social preview per page, rendered at build time with satori (`src/lib/og.ts`) |
| `src/layouts/SiteLayout.astro` | Head, navigation and footer of every page outside the docs |

## Contributing

Contributions are welcome: see the [contributing guide](https://github.com/Pollora/.github/blob/main/CONTRIBUTING.md). Report security issues privately, as described in the [security policy](https://github.com/Pollora/.github/blob/main/SECURITY.md).

## License

© [RuBee group](https://rubee.group)
