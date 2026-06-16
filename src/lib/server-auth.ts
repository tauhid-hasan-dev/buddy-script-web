import type { AuthUser } from "./auth";
import { serverFetch } from "./server-api";

/**
 * Resolve the signed-in user at request time from the auth cookie, or null if
 * absent/invalid. Used to seed the client user cache so the avatar and name are
 * already in the server-rendered HTML — no fallback-then-photo flash on reload.
 */
export async function getServerUser(): Promise<AuthUser | null> {
  const body = await serverFetch<{ user: AuthUser }>("/api/auth/me");
  return body?.user ?? null;
}
