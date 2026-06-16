"use client";

import { useEffect, useRef } from "react";

import { getFeedUpdates, type Post, type PostState } from "./posts";

// Near-real-time feed updates — new posts AND live like/comment state.
//
// The feed is server-seeded once and then only mutated locally (a user's own
// new post, their own deletes/reactions). Nothing tells one browser about
// *other* users' activity, so a second viewer had to refresh to see new posts,
// new reactions, or new comments.
//
// This hook closes that gap with one poll that does two things:
//   1. fetches posts newer than the caller's top post (to prepend), and
//   2. refreshes the like/comment state of the posts already on screen,
// so reactions and comment counts go live with the same latency as a new post.
// It is deliberately additive: it never replaces or reorders existing posts —
// only their mutable counts are patched — so a viewer's in-flight optimistic
// state is preserved.
//
// Why /api/feed/updates and not /api/feed: the main feed's first page is cached
// per-viewer for ~15s for read throughput. Polling it would cap "real-time" at
// that TTL. The updates endpoint is uncached and cheap (a bounded `id > after`
// scan plus an indexed state lookup over the on-screen ids).
//
// Why polling and not Supabase Realtime: the browser talks only to the Express
// API (JWT in an httpOnly cookie); Supabase is server-side-only by design and
// no browser-safe publishable key is provisioned. Polling the authed API keeps
// auth and post-privacy enforced by the server. Swap this hook's body for a
// Supabase channel if a publishable key is ever added; the callback contract
// (onNewPosts / onUpdated) stays the same.

const POLL_INTERVAL_MS = 5000;

interface UseNewPostsOptions {
  /** Reads the newest rendered post id (BigInt-as-string), or null when empty. */
  getNewestId: () => string | null;
  /** Reads the ids of all posts currently on screen, for state refresh. */
  getVisibleIds: () => string[];
  /** Receives new posts newest-first, ready to prepend as a block. */
  onNewPosts: (posts: Post[]) => void;
  /** Receives refreshed like/comment state for on-screen posts. */
  onUpdated: (updated: PostState[]) => void;
  /** Gate polling until the initial feed has loaded. */
  enabled: boolean;
}

/**
 * Polls for new posts and refreshed like/comment state. Pauses while the tab is
 * hidden and does an immediate catch-up poll when it becomes visible again.
 * Getters/callbacks are read through refs so the polling effect mounts once and
 * never tears down its timer on the parent's frequent re-renders.
 */
export function useNewPosts({
  getNewestId,
  getVisibleIds,
  onNewPosts,
  onUpdated,
  enabled,
}: UseNewPostsOptions): void {
  const ref = useRef({ getNewestId, getVisibleIds, onNewPosts, onUpdated });
  ref.current = { getNewestId, getVisibleIds, onNewPosts, onUpdated };

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;

    async function poll() {
      // Skip overlapping polls (slow network) and polls while backgrounded.
      if (inFlight || cancelled || document.visibilityState !== "visible") {
        return;
      }
      // With no posts yet there is no anchor to ask "newer than" and nothing on
      // screen to refresh — the regular feed load will seed one.
      const after = ref.current.getNewestId();
      if (after === null) return;
      const ids = ref.current.getVisibleIds();

      inFlight = true;
      try {
        const { posts, updated } = await getFeedUpdates(after, ids);
        if (cancelled) return;
        // The endpoint returns new posts newest-first, the order the caller
        // prepends as a block — so the feed stays newest-on-top.
        if (posts.length > 0) ref.current.onNewPosts(posts);
        if (updated.length > 0) ref.current.onUpdated(updated);
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
