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

## En-têtes de sécurité

Définis dans `vercel.json` (`headers`, source `/(.*)`), donc versionnés avec le site et
appliqués aussi à `/mcp` : `X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`
(anti-clickjacking), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, et la
politique complète dans `Content-Security-Policy-Report-Only` (mode rapport : rien n'est bloqué
tant que le passage en `Content-Security-Policy` n'est pas fait).

- **Autoriser un nouveau service externe** (script, image, iframe, API) : ajouter son origine à la
  directive qui le charge dans le CSP de `vercel.json` (`script-src`, `img-src`, `connect-src`,
  `frame-src`...). Un service chargé par Google Tag Manager passe par ses balises, hors dépôt :
  s'il est bloqué, la console du navigateur le dit (`Refused to…`).
- **Aucun script en ligne dans nos pages** : un `<script>` sans `is:inline` ni `define:vars` est
  traité par Astro et émis comme fichier (`assetsInlineLimit: 0`). Pour passer une valeur à un
  script, l'importer (ex. `src/data/analytics.ts`) ou la poser dans un bloc
  `<script type="application/json">`. Pas de `onclick="…"` : un `addEventListener`.
- **Scripts en ligne de Starlight** (sélecteur de thème, barre latérale) : autorisés par hachage
  dans `script-src`. `npm run build` lance `scripts/check-csp.mjs` après le build : il échoue et
  affiche le hachage à ajouter si une mise à jour de Starlight change l'un de ces scripts, ou si
  une page contient un script en ligne ou un gestionnaire `on…=` non autorisé.
- **Concessions connues** : `'unsafe-eval'` pour Alpine.js (le build standard évalue les expressions
  des attributs ; le build `@alpinejs/csp` l'éviterait, au prix de réécrire la
  quatre-vingtaine d'attributs `x-data`/`@click`/`x-show`), `'wasm-unsafe-eval'` pour Pagefind, `style-src 'unsafe-inline'`
  pour les attributs `style=` d'Expressive Code.
- **Pourquoi pas `security.csp` d'Astro** : il hache aussi les styles, ce qui interdit les attributs
  `style=`, et il écrit une balise `<meta>`, qui est toujours appliquée (pas de mode rapport) et ne
  porte pas `frame-ancestors`.
- La console de Claude in Chrome ne remonte pas les violations de CSP : pour les mesurer, écouter
  l'événement `securitypolicyviolation` installé avant le chargement de la page (Puppeteer,
  `evaluateOnNewDocument`).
