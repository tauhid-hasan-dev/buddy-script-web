import { cookies } from "next/headers";

// Shared server-side fetch to the Express API. Importing `next/headers` makes
// this module (and anything that imports it) server-only — it throws if pulled
// into client code.
//
// The browser talks to the API through the same-origin `/api` rewrite, but a
// React Server Component runs on the server where that rewrite doesn't apply,
// so we hit the API origin directly and forward the incoming httpOnly cookie.
const API_URL =
  process.env.API_URL ?? "https://buddy-script-server-iota.vercel.app";

const AUTH_COOKIE = "token";

/**
 * Fetch `path` from the API on behalf of the signed-in user, forwarding their
 * auth cookie. Returns the parsed JSON as T, or null when the user isn't
 * authenticated or the request fails — the caller decides the fallback (the
 * client provider/component retries).
 */
export async function serverFetch<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { cookie: `${AUTH_COOKIE}=${token}` },
      // Per-request, user-specific data; never cache across requests.
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // Transient failure reaching the API.
    return null;
  }
}
