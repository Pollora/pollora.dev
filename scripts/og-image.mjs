import sharp from 'sharp';
import { readFileSync } from 'node:fs';
// Generates public/og-image.png (1200×630), the social preview for the homepage and the docs.
// Fonts come from the system (Space Grotesk, JetBrains Mono). Run: node scripts/og-image.mjs
const root = new URL('../', import.meta.url).pathname;
const b64 = (p) => 'data:image/svg+xml;base64,' + readFileSync(root + p).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#fb196d"/><stop offset=".33" stop-color="#ff314c"/>
      <stop offset=".66" stop-color="#ff5334"/><stop offset="1" stop-color="#ff8c12"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#fcf7f5"/>
  <rect width="1200" height="10" fill="url(#g)"/>
  <image x="80" y="78" width="260" height="105" xlink:href="${b64('src/assets/pollora-logo.svg')}"/>
  <text x="80" y="330" font-family="Space Grotesk" font-weight="700" font-size="84" letter-spacing="-2" fill="#1d142a">Modern PHP,</text>
  <text x="80" y="420" font-family="Space Grotesk" font-weight="700" font-size="84" letter-spacing="-2" fill="url(#g)">zero compromise.</text>
  <text x="82" y="510" font-family="JetBrains Mono" font-weight="500" font-size="28" fill="#5b5068">Laravel meets WordPress</text>
  <text x="82" y="556" font-family="JetBrains Mono" font-weight="500" font-size="24" fill="#ff5334">pollora.dev</text>
  <image x="790" y="190" width="370" height="370" xlink:href="${b64('src/assets/mascot-developer.svg')}"/>
</svg>`;
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(root + 'public/og-image.png');
console.log('public/og-image.png written');
