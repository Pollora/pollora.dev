#!/usr/bin/env node
// Runs after the build (postbuild): the Content-Security-Policy of vercel.json must let every page run.
//
// The policy allows scripts by origin ('self', Google Tag Manager) and a handful of inline scripts by
// hash: the ones Starlight writes in every page (theme picker, sidebar state...). A Starlight upgrade
// can change them, and the CSP would then block them without a word. This check fails the build when
// an inline script of a built page is not covered by a hash of the policy, or when a page has an inline
// event handler (onclick="...", which no hash allows).
//
// To fix: the script is ours → make it a processed <script> (no is:inline, no define:vars), Astro then
// emits it as a file. It is Starlight's → add the hash this check prints to script-src in vercel.json.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const POLICY_HEADER = /^content-security-policy(-report-only)?$/i;
// A script that runs: no type, a JavaScript type or a module. JSON data blocks (JSON-LD...) never run.
const EXECUTABLE = /^(|module|text\/javascript|application\/javascript)$/i;

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const policies = (config.headers ?? [])
	.flatMap((rule) => rule.headers)
	.filter((header) => POLICY_HEADER.test(header.key) && /script-src/.test(header.value));

if (policies.length === 0) {
	console.error('check-csp: no Content-Security-Policy with a script-src in vercel.json');
	process.exit(1);
}

// Every policy that restricts scripts must allow them: a page has to pass all of them
const allowed = policies.map(({ value }) => new Set([...value.matchAll(/'sha256-([^']+)'/g)].map((m) => m[1])));

// A tag, with quoted attribute values read whole: a value may hold "<" or "on…=" (Expressive Code keeps
// a block's code in the data-code attribute of its copy button), which is not a handler
const TAG = /<[a-z][\w-]*((?:\s+[^\s"'>=/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/gi;
const ATTRIBUTE_NAME = /(?:^|\s)([^\s"'>=/]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g;

const hasEventHandler = (html) =>
	[...html.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(TAG)].some(([, attributes]) =>
		[...attributes.matchAll(ATTRIBUTE_NAME)].some(([, name]) => /^on[a-z]+$/i.test(name)),
	);

const htmlFiles = (dir) =>
	readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return htmlFiles(path);
		return name.endsWith('.html') ? [path] : [];
	});

const dist = new URL('../dist', import.meta.url).pathname;
const problems = new Map();
const note = (message, file) => problems.set(message, [...(problems.get(message) ?? []), file]);

let pages = 0;
for (const file of htmlFiles(dist)) {
	pages++;
	const html = readFileSync(file, 'utf8');

	for (const [, attributes, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
		if (/\ssrc=/.test(attributes)) continue;
		const type = /\stype=["']?([^"'\s>]+)/.exec(attributes)?.[1] ?? '';
		if (!EXECUTABLE.test(type)) continue;
		const hash = createHash('sha256').update(body).digest('base64');
		if (allowed.some((hashes) => !hashes.has(hash))) {
			note(`inline script not allowed by the policy, add 'sha256-${hash}' to script-src if it is Starlight's: ${body.trim().slice(0, 70).replace(/\s+/g, ' ')}…`, file);
		}
	}

	if (hasEventHandler(html)) note('inline event handler (on…="…"): move it to an addEventListener in a script', file);
}

if (problems.size) {
	for (const [message, files] of problems) {
		console.error(`check-csp: ${message}\n  in ${files.length} page(s), e.g. ${files[0].replace(dist, 'dist')}`);
	}
	process.exit(1);
}
console.log(`check-csp: ${pages} pages, every inline script is allowed by the policy`);
