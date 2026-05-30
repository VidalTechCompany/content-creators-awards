/**
 * Validates Origin/Referer against trusted site URLs (CSRF defense for state-changing requests).
 */
export function assertTrustedOrigin(request: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const extra = process.env.TRUSTED_ORIGINS?.split(",").map((s) => s.trim().replace(/\/$/, "")) ?? [];
  const allowed = new Set([site, ...extra].filter(Boolean) as string[]);

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (allowed.size === 0) return;

  let candidate = origin;
  if (!candidate && referer) {
    try {
      candidate = new URL(referer).origin;
    } catch {
      candidate = null;
    }
  }

  if (!candidate) {
    candidate = new URL(request.url).origin;
  }

  if (!allowed.has(candidate)) {
    throw new Error("Untrusted origin");
  }
}
