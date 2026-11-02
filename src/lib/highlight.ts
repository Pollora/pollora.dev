// Tiny syntax highlighters for the homepage showcases: they only wrap tokens in the
// `token-*` classes of global.css. The code they colour is copied from the docs.

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function run(src: string, re: RegExp, wrap: (m: RegExpMatchArray) => string): string {
	let out = '';
	let last = 0;
	for (const m of src.matchAll(re)) {
		out += esc(src.slice(last, m.index));
		out += wrap(m);
		last = (m.index ?? 0) + m[0].length;
	}
	return out + esc(src.slice(last));
}
const span = (cls: string, s: string) => `<span class="token-${cls}">${esc(s)}</span>`;

const PHP = /('[^']*')|(\/\/.*$)|(#\[[^\]]*\])|(\b[A-Z]\w*(?=::))|(->|::)(\w+)|(\$\w+)|(\b\d+\b)/gm;
export const php = (src: string) =>
	run(src, PHP, (m) => {
		if (m[1]) return span('string', m[1]);
		if (m[2]) return span('comment', m[2]);
		if (m[3]) return span('attribute', m[3]);
		if (m[4]) return span('class', m[4]);
		if (m[5]) return `${esc(m[5])}<span class="token-${/^[A-Z]/.test(m[6]) ? 'variable' : 'function'}">${m[6]}</span>`;
		if (m[7]) return span('variable', m[7]);
		return span('attribute', m[8]);
	});

const BLADE = /(\{\{[\s\S]*?\}\}|\{!![\s\S]*?!!\})|(<\/?[A-Za-z][\w-]*)|("[^"]*")|(\/?>)/g;
export const blade = (src: string) =>
	run(src, BLADE, (m) => {
		if (m[1]) return span('function', m[1]);
		if (m[2]) return span('keyword', m[2]);
		if (m[3]) return span('string', m[3]);
		return span('keyword', m[4]);
	});

export const env = (src: string) =>
	src
		.split('\n')
		.map((l) => l.replace(/^(\w+)=(.*)$/, (_, k, v) => `<span class="token-attribute">${k}</span>=<span class="token-string">${esc(v)}</span>`))
		.join('\n');

/** A shell prompt line: `$` dimmed, the rest as typed. */
export const shell = (src: string) => src.replace(/^\$ /gm, '§').split('§').map((p, i) => (i ? `<span class="token-comment">$</span> ${esc(p)}` : esc(p))).join('');
