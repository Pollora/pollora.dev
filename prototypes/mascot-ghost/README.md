# Pollora ghost, line-art 3D (v1)

Prototype of the 3D mascot for the home hero: built in code (three.js, fat lines, hidden lines masked),
modelled on `src/assets/pollora-icon.svg` (dome head, scalloped hem, round glasses). Validated by the owner on 2026-10-20.

Open `ghost-v1.html` through any static server after copying `three.module.js`, `three.core.js` and the
`examples/jsm/lines/*` files (LineSegments2, LineSegmentsGeometry, LineMaterial) next to it, with an import map
`"three": "./three.module.js"`. Add `?live` to follow the pointer, `?ry=30&rx=-8` for a fixed angle.

Choices to keep: lines only (no fills), one hem line with rounded lobes that rises on the sides, solid round
pupils in the stroke colour, one bold bridge, a bold smile, thin body lines, pink to orange gradient.
