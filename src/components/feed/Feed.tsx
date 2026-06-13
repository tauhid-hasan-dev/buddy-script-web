"use client";

import { useCallback, useEffect, useState } from "react";

import { getFeed, type Post } from "@/lib/posts";
import { getMe, type AuthUser } from "@/lib/auth";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";

export default function Feed() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Current user and the first feed page load together.
        const [me, page] = await Promise.all([getMe(), getFeed()]);
        if (cancelled) return;
        setCurrentUser(me.user);
        setPosts(page.posts);
        setCursor(page.nextCursor);
      } catch {
        if (!cancelled) setError("Couldn't load your feed. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getFeed(cursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setCursor(page.nextCursor);
    } catch {
      // Keep the cursor so the button stays available for a retry.
    } finally {
      setLoadingMore(false);
    }
  }

  const handleCreated = useCallback((post: Post) => {
    // New posts are the newest, so they go to the top.
    setPosts((prev) => [post, ...prev]);
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  return (
    <>
      <CreatePost currentUser={currentUser} onCreated={handleCreated} />

      {loading && (
        <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
          <p style={{ margin: 0, textAlign: "center", color: "#666" }}>Loading feed…</p>
        </div>
      )}

      {error && !loading && (
        <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
          <p style={{ margin: 0, textAlign: "center", color: "#d00" }}>{error}</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
          <p style={{ margin: 0, textAlign: "center", color: "#666" }}>
            No posts yet. Be the first to share something!
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onDeleted={handleDeleted}
        />
      ))}

      {cursor && !loading && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <button
            type="button"
            className="_previous_comment_txt"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more posts"}
          </button>
        </div>
      )}
    </>
  );
}
