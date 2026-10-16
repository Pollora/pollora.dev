# pollora.dev

## Publier une release (numéro de version)

Le numéro de la release courante vit à un seul endroit : `src/data/release.json`
(version, date, version de Laravel). Les pages Astro (`index`, `roadmap`, `press`) et
`astro.config.mjs` (llms.txt) le lisent : ne jamais y écrire un numéro en dur.

- Pour passer à une nouvelle release : `npm run release -- 13.36.1 --date "16 October 2026"`.
  Ça met à jour le JSON et les mentions « release courante » des docs Markdown
  (`installation.md`, `faq.md`, `dashboard.md`), qui ne peuvent pas importer le JSON
  car elles sont synchronisées depuis Pollora/documentation.
- `npm run check-release` (lancé automatiquement avant `npm run build`) échoue si une
  mention est en retard ou si une phrase a été reformulée au point que le script ne la
  retrouve plus.
- Nouvelle mention « release courante » dans les docs : l'ajouter à `TARGETS` dans
  `scripts/release.mjs`, sinon elle ne sera pas surveillée.
- Après un `npm run sync-docs`, relancer `npm run release -- <version courante>` : la
  sync peut réécrire les docs avec un ancien numéro.
- Hors périmètre, volontairement : articles de blog, badge « New in 13.35.2 » de
  `features.astro`, exemples `--ver=13.35.0`. Ce sont des références historiques.
