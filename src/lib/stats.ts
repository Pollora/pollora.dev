/**
 * Public figures fetched at build time. A failed fetch returns null, and the page leaves the
 * figure out rather than failing the build or showing a stale number.
 */
export async function monthlyInstalls(pkg = 'pollora/framework'): Promise<number | null> {
	try {
		const res = await fetch(`https://packagist.org/packages/${pkg}.json`);
		if (!res.ok) return null;
		const data = await res.json();
		const monthly = data?.package?.downloads?.monthly;
		return typeof monthly === 'number' && monthly > 0 ? monthly : null;
	} catch {
		return null;
	}
}

/**
 * Stars of a GitHub repo. Below `minStars` the figure is left out (null): a small count reads as
 * a lack of traction, so the button shows only the call to action until the number helps.
 */
export const STAR_THRESHOLD = 100;
export async function githubStars(repo = 'Pollora/pollora', minStars = STAR_THRESHOLD): Promise<number | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Accept: 'application/vnd.github+json' } });
		if (!res.ok) return null;
		const stars = (await res.json())?.stargazers_count;
		return typeof stars === 'number' && stars >= minStars ? stars : null;
	} catch {
		return null;
	}
}

/** 2783 → "2.8k", 940 → "940" */
export const compact = (n: number) =>
	n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n);
