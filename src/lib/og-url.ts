/**
 * The social preview of a page, rendered by src/pages/og/[...slug].png.ts:
 * "/" is /og/index.png, "/routing/controllers/" is /og/routing/controllers.png.
 */
export const ogImageFor = (pathname: string) => {
	const slug = pathname.replace(/^\/+|\/+$/g, '') || 'index';
	return `https://pollora.dev/og/${slug}.png`;
};
