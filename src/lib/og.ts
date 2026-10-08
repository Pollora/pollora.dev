import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

/**
 * Social preview images (1200×630), one per page, rendered at build time by src/pages/og/[...slug].png.ts.
 * Satori turns the text into paths with the fonts loaded here, so the build needs no system font.
 */
const root = process.cwd();
const file = (path: string) => readFileSync(resolve(root, path));
const svgData = (path: string) => `data:image/svg+xml;base64,${file(path).toString('base64')}`;

const fonts = [
	{ name: 'Space Grotesk', weight: 700 as const, data: file('node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff') },
	{ name: 'Space Grotesk', weight: 500 as const, data: file('node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff') },
	{ name: 'JetBrains Mono', weight: 500 as const, data: file('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff') },
];
const logo = svgData('src/assets/pollora-logo.svg');
const mascot = svgData('src/assets/mascot-developer.svg');
const gradient = 'linear-gradient(90deg, #fb196d, #ff314c, #ff5334, #ff8c12)';

export type OgCard = { title: string; kicker: string; tag?: string };

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node => ({
	type,
	props: { style, children, ...props },
});

const titleSize = (title: string) => (title.length <= 32 ? 78 : title.length <= 60 ? 64 : 52);

export async function renderOg({ title, kicker, tag }: OgCard): Promise<Buffer> {
	const tree = h('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: '#fcf7f5', position: 'relative', fontFamily: 'Space Grotesk' }, [
		h('div', { width: 1200, height: 10, backgroundImage: gradient }),
		h('div', { display: 'flex', flexDirection: 'column', padding: '64px 80px 0', width: 820, flexGrow: 1 }, [
			h('img', { width: 210, height: 85 }, undefined, { src: logo, width: 210, height: 85 }),
			h('div', { display: 'flex', alignItems: 'center', marginTop: 54, gap: 16 }, [
				h('div', { width: 14, height: 14, borderRadius: 999, backgroundImage: 'linear-gradient(135deg, #fb196d, #ff8c12)' }),
				h('div', { fontFamily: 'JetBrains Mono', fontSize: 26, letterSpacing: 2, textTransform: 'uppercase', color: '#5b5068' }, kicker),
				...(tag ? [h('div', { fontFamily: 'JetBrains Mono', fontSize: 22, color: '#ff5334', border: '2px solid #f3c9bd', borderRadius: 8, padding: '2px 10px' }, tag)] : []),
			]),
			h('div', { marginTop: 22, fontSize: titleSize(title), fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, color: '#1d142a', display: 'flex' }, title),
		]),
		h('div', { position: 'absolute', left: 82, bottom: 52, fontFamily: 'JetBrains Mono', fontSize: 24, color: '#ff5334' }, 'pollora.dev'),
		h('img', { position: 'absolute', right: 40, bottom: 30, width: 330, height: 330 }, undefined, { src: mascot, width: 330, height: 330 }),
	]);

	const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
