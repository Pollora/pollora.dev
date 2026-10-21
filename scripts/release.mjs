#!/usr/bin/env node
// Single place that knows where the current release number is written.
//   node scripts/release.mjs 13.35.6 [--date "16 October 2026"]   bump everything
//   node scripts/release.mjs --check                              fail if a spot is out of date (runs before build)
// Astro pages and astro.config.mjs read src/data/release.json directly; the Markdown docs cannot
// import it (they are synced from Pollora/documentation), so they are listed in TARGETS below.
// A new "current release" mention in the docs: add it to TARGETS, the check then keeps it honest.
import { readFileSync, writeFileSync } from 'node:fs';

const DATA = new URL('../src/data/release.json', import.meta.url);
const root = (p) => new URL(`../${p}`, import.meta.url);
const release = JSON.parse(readFileSync(DATA, 'utf8'));

// [file, regex with the version in group 1 (and nothing else varying), expected number of matches]
const TARGETS = [
	['src/content/docs/getting-started/installation.md', /current release is \*\*v(\d+\.\d+\.\d+)\*\*/g, 1],
	['src/content/docs/getting-started/installation.md', /today that is the stable v(\d+\.\d+\.\d+)/g, 1],
	['src/content/docs/faq.md', /the current release, v(\d+\.\d+\.\d+), is a stable/g, 1],
	['src/content/docs/advanced/dashboard.md', /Pollora v(\d+\.\d+\.\d+) \(latest: v(\d+\.\d+\.\d+)\)/g, 1],
	['src/content/docs/advanced/dashboard.md', /"(?:current|latest)": "(\d+\.\d+\.\d+)"/g, 2],
	['src/content/docs/advanced/dashboard.md', /latest stable: v(\d+\.\d+\.\d+)/g, 1],
	['src/content/docs/compare.md', /v(\d+\.\d+\.\d+) stable, a young project/g, 1],
	['src/content/docs/why.md', /The current release, v(\d+\.\d+\.\d+), is stable/g, 1],
];

const versionsIn = (m) => m.slice(1).filter(Boolean);

function scan() {
	const problems = [];
	for (const [file, re, expected] of TARGETS) {
		const text = readFileSync(root(file), 'utf8');
		const matches = [...text.matchAll(re)];
		if (matches.length !== expected) problems.push(`${file}: ${re} matched ${matches.length}x, expected ${expected} (was the wording changed?)`);
		for (const m of matches) for (const v of versionsIn(m)) if (v !== release.version) problems.push(`${file}: says ${v}, current is ${release.version}`);
	}
	return problems;
}

const args = process.argv.slice(2);
if (args.includes('--check')) {
	const problems = scan();
	if (problems.length) {
		console.error(`Release ${release.version} is not carried everywhere:\n- ${problems.join('\n- ')}\nRun: node scripts/release.mjs ${release.version}`);
		process.exit(1);
	}
	console.log(`Release ${release.version}: all spots up to date.`);
	process.exit(0);
}

const version = args.find((a) => /^\d+\.\d+\.\d+$/.test(a));
if (!version) {
	console.error('Usage: node scripts/release.mjs <x.y.z> [--date "9 October 2026"] | --check');
	process.exit(1);
}
const dateIdx = args.indexOf('--date');
release.version = version;
release.laravel = version.split('.').slice(0, 2).join('.');
release.date = dateIdx > -1 ? args[dateIdx + 1] : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
writeFileSync(DATA, JSON.stringify(release, null, '\t') + '\n');

for (const file of new Set(TARGETS.map((t) => t[0]))) {
	let text = readFileSync(root(file), 'utf8');
	for (const [f, re] of TARGETS) {
		if (f !== file) continue;
		text = text.replace(re, (whole, ...groups) => {
			let out = whole;
			for (const v of groups.filter((g) => /^\d+\.\d+\.\d+$/.test(g))) out = out.replace(v, version);
			return out;
		});
	}
	writeFileSync(root(file), text);
}

const problems = scan();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`Release bumped to ${version} (Laravel ${release.laravel}, ${release.date}).`);
