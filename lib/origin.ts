/**
 * The site's origin as the caller's browser sees it, for building absolute
 * URLs that an outside service will send the browser back to.
 *
 * `request.url` is not enough: under `next start` its origin is always the
 * server's own `http://localhost:<port>`, whatever host the browser used. The
 * forwarded headers carry the real host (Next.js fills them in from `Host`
 * when no proxy set them; a hosting proxy such as Vercel's sets them).
 *
 * The headers come from the caller, who could name another site and then hand
 * the resulting checkout link to someone else. Setting SITE_URL (for example
 * https://prephrase.example) pins the origin and closes that door; without it
 * the headers are used, which keeps local development and previews working.
 */
export function publicOrigin(request: Request): string {
  const pinned = process.env.SITE_URL?.trim();
  if (pinned) {
    try {
      return new URL(pinned).origin;
    } catch {
      // Not a URL: ignore it and fall back to the request.
    }
  }
  const first = (value: string | null) => value?.split(",")[0]?.trim() || undefined;
  const host =
    first(request.headers.get("x-forwarded-host")) ?? first(request.headers.get("host"));
  const proto = first(request.headers.get("x-forwarded-proto"));
  if (host && (proto === "http" || proto === "https")) {
    try {
      return new URL(`${proto}://${host}`).origin;
    } catch {
      // Malformed header: fall back to the URL Next.js built.
    }
  }
  return new URL(request.url).origin;
}
