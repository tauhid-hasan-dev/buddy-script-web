"use client";

import { useCallback, useEffect, useState } from "react";

import { getFeed, type FeedPage, type Post } from "@/lib/posts";
import { useCurrentUser } from "@/lib/currentUser";
import Spinner from "@/components/Spinner";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";

export default function Feed({ initialPage }: { initialPage: FeedPage | null }) {
  const { user: currentUser } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>(initialPage?.posts ?? []);
  const [cursor, setCursor] = useState<string | null>(
    initialPage?.nextCursor ?? null
  );
  const [loading, setLoading] = useState(initialPage === null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The server seeds the first page (see getServerFeed); only fetch from the
    // client when seeding failed transiently. A seeded page needs no re-fetch.
    if (initialPage !== null) return;
    let cancelled = false;
    async function load() {
      try {
        const page = await getFeed();
        if (cancelled) return;
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
  }, [initialPage]);

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
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Spinner color="#377dff" />
          </div>
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
            {loadingMore ? (
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <Spinner size={18} />
              </span>
            ) : (
              "Load more posts"
            )}
          </button>
        </div>
      )}
    </>
  );
}
