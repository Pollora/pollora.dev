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

/** 2783 → "2.8k", 940 → "940" */
export const compact = (n: number) =>
	n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n);
