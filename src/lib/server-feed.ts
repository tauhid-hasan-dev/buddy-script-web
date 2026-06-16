import type { FeedPage } from "./posts";
import { serverFetch } from "./server-api";

/**
 * Fetch the first feed page at request time, or null if the user isn't
 * authenticated or the API call fails. Used to seed the client `<Feed>` so the
 * post list is in the server-rendered HTML — no "Loading feed…" flash on load.
 *
 * Only the first page is seeded; "Load more" still pages from the client.
 */
export function getServerFeed(limit = 20): Promise<FeedPage | null> {
  return serverFetch<FeedPage>(`/api/feed?limit=${limit}`);
}
