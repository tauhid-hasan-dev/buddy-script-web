"use client";

import { useEffect, useRef, useState } from "react";

import { fullName } from "@/lib/format";
import { REACTION_BY_TYPE, type PostAuthor, type ReactionType } from "@/lib/posts";

// The minimal page shape Likers needs. Post likers carry a reaction `type`;
// comment likers (binary likes) don't, so it's optional.
interface LikerLike {
  user: PostAuthor;
  type?: ReactionType;
}
interface LikersPageLike {
  likes: LikerLike[];
}

interface LikerName {
  name: string;
  type?: ReactionType;
}

// A clickable count that opens a small popover listing who reacted to the
// post/comment/reply (with each person's reaction emoji when available). The
// fetcher is injected so the same component serves posts and comments without
// knowing which endpoint it hits.
export default function Likers({
  count,
  label,
  fetcher,
}: {
  count: number;
  label: string;
  fetcher: (page: number) => Promise<LikersPageLike>;
}) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<LikerName[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: globalThis.MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && names === null && !loading) {
      setLoading(true);
      setError(false);
      try {
        const page = await fetcher(1);
        setNames(
          page.likes.map((entry) => ({
            name: fullName(entry.user),
            type: entry.type,
          }))
        );
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <span ref={wrapRef} style={{ position: "relative", cursor: "pointer" }}>
      <span onClick={count > 0 ? toggle : undefined}>
        <span>{count}</span> {label}
      </span>
      {open && (
        // Span-based block so this remains valid HTML when nested inside the
        // template's <p> (posts) or <span> (comments) — a <div>/<ul> there
        // would be an invalid descendant and trigger hydration errors.
        <span
          style={{
            display: "block",
            position: "absolute",
            bottom: "100%",
            left: 0,
            zIndex: 20,
            minWidth: 180,
            maxHeight: 220,
            overflowY: "auto",
            marginBottom: 6,
            padding: "10px 14px",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
            border: "1px solid #eee",
            textAlign: "left",
          }}
        >
          {loading && <span style={{ fontSize: 13 }}>Loading…</span>}
          {error && (
            <span style={{ fontSize: 13, color: "#d00" }}>
              Couldn&apos;t load likes.
            </span>
          )}
          {!loading && !error && names && names.length === 0 && (
            <span style={{ fontSize: 13 }}>No reactions yet.</span>
          )}
          {!loading &&
            !error &&
            names &&
            names.map((entry, i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  fontSize: 13,
                  padding: "3px 0",
                  color: "#112032",
                }}
              >
                {entry.type && (
                  <span style={{ marginRight: 6 }}>
                    {REACTION_BY_TYPE[entry.type].emoji}
                  </span>
                )}
                {entry.name}
              </span>
            ))}
        </span>
      )}
    </span>
  );
}
