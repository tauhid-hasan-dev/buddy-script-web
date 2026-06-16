"use client";

import { useEffect, useRef } from "react";

import { getFeedUpdates, type Post } from "./posts";

// Near-real-time feed updates.
//
// The feed is server-seeded once and then only mutated locally (a user's own
// new post, their own deletes/reactions). Nothing tells one browser about
// *other* users' posts, so a second viewer had to refresh to see them.
//
// This hook closes that gap by polling a dedicated "what's newer than X"
// endpoint and handing back the posts the caller hasn't seen yet. It is
// deliberately additive: it never replaces or reorders existing posts, so a
// viewer's in-flight optimistic state (a reaction they just tapped, a comment
// box they're typing under) is never clobbered by a poll.
//
// Why /api/feed/updates and not /api/feed: the main feed's first page is cached
// per-viewer for ~15s for read throughput. Polling it would cap "real-time" at
// that TTL — another user's post could take 15s to show. The updates endpoint
// is uncached and cheap (a bounded `id > after` scan on the same index), so new
// posts surface within one poll interval regardless of the feed cache.
//
// Why polling and not Supabase Realtime: the browser talks only to the Express
// API (JWT in an httpOnly cookie); Supabase is server-side-only by design and
// no browser-safe publishable key is provisioned. Polling the authed API keeps
// auth and post-privacy enforced by the server — a Realtime websocket as the
// anon role would bypass both. Swap this hook's body for a Supabase channel if
// a publishable key is ever added; the Feed contract (onNewPosts) stays the same.

const POLL_INTERVAL_MS = 5000;

/**
 * Polls for posts newer than the caller's current top post and calls
 * `onNewPosts` with them. Pauses while the tab is hidden and does an immediate
 * catch-up poll when it becomes visible again.
 *
 * @param getNewestId  Reads the id of the newest rendered post (BigInt-as-string),
 *                     or null when the feed is empty. Passed as a getter so the
 *                     hook always sees the latest value without re-subscribing.
 * @param onNewPosts   Receives new posts newest-first, ready to prepend as a block.
 * @param enabled      Gate polling until the initial feed has loaded.
 */
export function useNewPosts(
  getNewestId: () => string | null,
  onNewPosts: (posts: Post[]) => void,
  enabled: boolean
): void {
  // Hold the callbacks in refs so the polling effect runs once and never tears
  // down/recreates its timer when the parent re-renders (which it does on every
  // new post).
  const getNewestIdRef = useRef(getNewestId);
  const onNewPostsRef = useRef(onNewPosts);
  getNewestIdRef.current = getNewestId;
  onNewPostsRef.current = onNewPosts;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;

    async function poll() {
      // Skip overlapping polls (slow network) and polls while backgrounded.
      if (inFlight || cancelled || document.visibilityState !== "visible") {
        return;
      }
      // With no posts yet there is no anchor to ask "newer than" — the regular
      // feed load will seed one; nothing to do this tick.
      const after = getNewestIdRef.current();
      if (after === null) return;

      inFlight = true;
      try {
        const { posts } = await getFeedUpdates(after);
        if (cancelled || posts.length === 0) return;
        // The endpoint returns newest-first, which is the order the caller
        // prepends as a block — so the feed stays newest-on-top.
        onNewPostsRef.current(posts);
      } catch {
        // Transient failure — the next tick retries. Nothing to surface.
      } finally {
        inFlight = false;
      }
    }

    const timer = setInterval(poll, POLL_INTERVAL_MS);

    // Catch up the moment the user returns to the tab instead of waiting out
    // the remaining interval.
    function onVisible() {
      if (document.visibilityState === "visible") void poll();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);
}
