/** Resolves a static asset path against Vite's base URL, so links keep working whether the app
 * is built with an absolute base ("/", the real deploy) or a relative one (preview hosting). */
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
