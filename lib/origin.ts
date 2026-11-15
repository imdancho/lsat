/**
 * The site's origin as the caller's browser sees it, for building absolute
 * URLs that an outside service will send the browser back to.
 *
 * `request.url` is not enough: under `next start` its origin is always the
 * server's own `http://localhost:<port>`, whatever host the browser used. The
 * forwarded headers carry the real host (Next.js fills them in from `Host`
 * when no proxy set them; a hosting proxy such as Vercel's sets them).
 *
 * The headers come from the caller, so this is only safe where a wrong origin
 * can hurt nobody but the caller, as with the redirect URLs of a test-mode
 * checkout. Real payments should pin the origin in configuration instead.
 */
export function publicOrigin(request: Request): string {
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
