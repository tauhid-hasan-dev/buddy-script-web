"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { ApiError } from "@/lib/api";
import { fullName, formatRelativeTime } from "@/lib/format";
import {
  deletePost,
  reactToPost,
  unreactPost,
  updatePost,
  getPostLikers,
  REACTIONS,
  REACTION_BY_TYPE,
  type Post,
  type ReactionCount,
  type ReactionType,
  type Visibility,
} from "@/lib/posts";
import {
  getComments,
  createComment,
  type Comment,
} from "@/lib/comments";
import type { AuthUser } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import CommentNode from "./CommentNode";
import Likers from "./Likers";

function NewCommentForm({
  currentUser,
  onSubmit,
}: {
  currentUser: AuthUser | null;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const content = value.trim();
    if (!content || pending) return;
    setPending(true);
    try {
      await onSubmit(content);
      setValue("");
    } catch {
      // Preserve the draft for a retry.
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="_feed_inner_comment_box">
      <form
        className="_feed_inner_comment_box_form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="_feed_inner_comment_box_content">
          <div className="_feed_inner_comment_box_content_image">
            <Avatar
              src={currentUser?.avatarUrl}
              name={currentUser ? fullName(currentUser) : ""}
              className="_comment_img"
              size={26}
            />
          </div>
          <div className="_feed_inner_comment_box_content_txt">
            <textarea
              className="form-control _comment_textarea"
              placeholder="Write a comment"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
            ></textarea>
          </div>
        </div>
        <div className="_feed_inner_comment_box_icon">
          <button type="button" className="_feed_inner_comment_box_icon_btn" aria-label="Record audio">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M13.167 6.534a.5.5 0 01.5.5c0 3.061-2.35 5.582-5.333 5.837V14.5a.5.5 0 01-1 0v-1.629C4.35 12.616 2 10.096 2 7.034a.5.5 0 011 0c0 2.679 2.168 4.859 4.833 4.859 2.666 0 4.834-2.18 4.834-4.86a.5.5 0 01.5-.5zM7.833.667a3.218 3.218 0 013.208 3.22v3.126c0 1.775-1.439 3.22-3.208 3.22a3.218 3.218 0 01-3.208-3.22V3.887c0-1.776 1.44-3.22 3.208-3.22zm0 1a2.217 2.217 0 00-2.208 2.22v3.126c0 1.223.991 2.22 2.208 2.22a2.217 2.217 0 002.208-2.22V3.887c0-1.224-.99-2.22-2.208-2.22z" clipRule="evenodd" />
            </svg>
          </button>
          <button type="button" className="_feed_inner_comment_box_icon_btn" aria-label="Add image">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="submit"
            className="_feed_inner_comment_box_icon_btn _comment_send_btn"
            disabled={pending || !value.trim()}
            aria-busy={pending}
            aria-label="Send comment"
          >
            {pending ? (
              <span className="_comment_spinner" role="status" aria-label="Sending" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#377DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PostCard({
  post,
  currentUser,
  onDeleted,
}: {
  post: Post;
  currentUser: AuthUser | null;
  onDeleted: (id: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Content/visibility live in local state so an inline edit updates the card
  // immediately without waiting on a feed refetch.
  const [content, setContent] = useState(post.content);
  const [visibility, setVisibility] = useState<Visibility>(post.visibility);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState<Visibility>(post.visibility);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [myReaction, setMyReaction] = useState<ReactionType | null>(post.myReaction);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [reactions, setReactions] = useState<ReactionCount[]>(post.reactions);
  const [reactPending, setReactPending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const isOwner = currentUser?.id === post.author.id;

  // Optimistically recompute the per-type breakdown for an instant UI update;
  // the server response then reconciles it to the authoritative tallies.
  function recomputeReactions(
    list: ReactionCount[],
    from: ReactionType | null,
    to: ReactionType | null
  ): ReactionCount[] {
    const counts = new Map<ReactionType, number>(
      list.map((r) => [r.type, r.count])
    );
    if (from) counts.set(from, (counts.get(from) ?? 1) - 1);
    if (to) counts.set(to, (counts.get(to) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Set a reaction, switch types, or clear it (next === null). One code path
  // for the picker, the button toggle, and rollback.
  async function applyReaction(next: ReactionType | null) {
    if (reactPending) return;
    setPickerOpen(false);
    setReactPending(true);

    const prev = { myReaction, likeCount, reactions };
    const optimistic = recomputeReactions(reactions, myReaction, next);
    setMyReaction(next);
    setReactions(optimistic);
    setLikeCount(optimistic.reduce((sum, r) => sum + r.count, 0));

    try {
      const state =
        next === null ? await unreactPost(post.id) : await reactToPost(post.id, next);
      setMyReaction(state.myReaction);
      setLikeCount(state.likeCount);
      setReactions(state.reactions);
    } catch {
      setMyReaction(prev.myReaction);
      setLikeCount(prev.likeCount);
      setReactions(prev.reactions);
    } finally {
      setReactPending(false);
    }
  }

  // Clicking the main button likes when there's no reaction yet, otherwise
  // clears the current one (Facebook behavior).
  function toggleReaction() {
    void applyReaction(myReaction ? null : "LIKE");
  }

  // Small open/close delay so the picker doesn't flicker as the cursor travels
  // between the button and the popover.
  function openPicker() {
    if (pickerTimer.current) clearTimeout(pickerTimer.current);
    setPickerOpen(true);
  }
  function closePickerSoon() {
    if (pickerTimer.current) clearTimeout(pickerTimer.current);
    pickerTimer.current = setTimeout(() => setPickerOpen(false), 200);
  }

  const activeReaction = myReaction ? REACTION_BY_TYPE[myReaction] : null;

  async function loadComments() {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const page = await getComments(post.id, commentsCursor ?? undefined);
      setComments((prev) => [...prev, ...page.comments]);
      setCommentsCursor(page.nextCursor);
      setCommentsLoaded(true);
    } catch {
      // Allow retry.
    } finally {
      setLoadingComments(false);
    }
  }

  async function submitComment(content: string) {
    const { comment } = await createComment(post.id, content);
    // Newest first, matching the server's ordering.
    setComments((prev) => [comment, ...prev]);
    setCommentCount((c) => c + 1);
    setCommentsLoaded(true);
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      onDeleted(post.id);
    } catch {
      setDeleting(false);
      setDropdownOpen(false);
    }
  }

  function startEdit() {
    setEditContent(content);
    setEditVisibility(visibility);
    setEditError(null);
    setEditing(true);
    setDropdownOpen(false);
  }

  async function saveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError("Content can't be empty.");
      return;
    }
    if (savingEdit) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const { post: updated } = await updatePost(post.id, {
        content: trimmed,
        visibility: editVisibility,
      });
      setContent(updated.content);
      setVisibility(updated.visibility);
      setEditing(false);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setEditError(
        apiError?.fieldErrors.content ??
          apiError?.message ??
          "Couldn't save your changes. Please try again."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!dropdownOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [dropdownOpen]);

  // Clear any pending picker-close timer when the card unmounts.
  useEffect(() => () => {
    if (pickerTimer.current) clearTimeout(pickerTimer.current);
  }, []);

  // How many top-level comments aren't on screen yet.
  const unseenComments = commentsLoaded
    ? (commentsCursor ? commentCount - comments.length : 0)
    : commentCount;

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <Avatar src={post.author.avatarUrl} name={fullName(post.author)} className="_post_img" size={44} />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {fullName(post.author)}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {formatRelativeTime(post.createdAt)} .{" "}
                <a href="#0">
                  {visibility === "PRIVATE" ? "Private" : "Public"}
                </a>
              </p>
            </div>
          </div>
          <div className="_feed_inner_timeline_post_box_dropdown" ref={dropdownRef}>
            <div className="_feed_timeline_post_dropdown">
              <button
                type="button"
                className="_feed_timeline_post_dropdown_link"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                  <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                </svg>
              </button>
            </div>
            {/* Dropdown — Save/Notification/Hide are presentational; only Edit
                and Delete are wired, and only for the post's author. */}
            <div className={`_feed_timeline_dropdown _timeline_dropdown${dropdownOpen ? " show" : ""}`}>
              <ul className="_feed_timeline_dropdown_list">
                <li className="_feed_timeline_dropdown_item">
                  <a href="#0" className="_feed_timeline_dropdown_link" onClick={(e) => e.preventDefault()}>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z"/>
                      </svg>
                    </span>
                    Save Post
                  </a>
                </li>
                <li className="_feed_timeline_dropdown_item">
                  <a href="#0" className="_feed_timeline_dropdown_link" onClick={(e) => e.preventDefault()}>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" fill="none" viewBox="0 0 20 22">
                        <path fill="#377DFF" fillRule="evenodd" d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0zm0 1.535c-3.6 0-6.11 2.802-6.11 5.316 0 2.127-.595 3.11-1.12 3.978-.422.697-.755 1.247-.755 2.444.173 1.93 1.455 2.944 7.986 2.944 6.494 0 7.817-1.06 7.988-3.01-.003-1.13-.336-1.681-.757-2.378-.526-.868-1.12-1.851-1.12-3.978 0-2.514-2.51-5.316-6.111-5.316z" clipRule="evenodd"/>
                      </svg>
                    </span>
                    Turn On Notification
                  </a>
                </li>
                <li className="_feed_timeline_dropdown_item">
                  <a href="#0" className="_feed_timeline_dropdown_link" onClick={(e) => e.preventDefault()}>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 2.25H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5zM6.75 6.75l4.5 4.5M11.25 6.75l-4.5 4.5"/>
                      </svg>
                    </span>
                    Hide
                  </a>
                </li>
                {isOwner && (
                  <>
                    <li className="_feed_timeline_dropdown_item">
                      <a
                        href="#0"
                        className="_feed_timeline_dropdown_link"
                        onClick={(event) => {
                          event.preventDefault();
                          startEdit();
                        }}
                      >
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                            <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M8.25 3H3a1.5 1.5 0 00-1.5 1.5V15A1.5 1.5 0 003 16.5h10.5A1.5 1.5 0 0015 15V9.75"/>
                            <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M13.875 1.875a1.591 1.591 0 112.25 2.25L9 11.25 6 12l.75-3 7.125-7.125z"/>
                          </svg>
                        </span>
                        Edit Post
                      </a>
                    </li>
                    <li className="_feed_timeline_dropdown_item">
                      <a
                        href="#0"
                        className="_feed_timeline_dropdown_link"
                        onClick={(event) => {
                          event.preventDefault();
                          void handleDelete();
                        }}
                        aria-busy={deleting}
                      >
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                            <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5"/>
                          </svg>
                        </span>
                        {deleting ? "Deleting…" : "Delete Post"}
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
        {editing ? (
          <div className="_feed_inner_timeline_post_edit" style={{ marginTop: 8 }}>
            <textarea
              className="form-control _textarea"
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8 }}
            />
            {editError && (
              <p style={{ color: "#d00", fontSize: 13, margin: "6px 0 0" }} role="alert">
                {editError}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <select
                value={editVisibility}
                onChange={(event) => setEditVisibility(event.target.value as Visibility)}
                aria-label="Post visibility"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", color: "#666" }}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit || !editContent.trim()}
                aria-busy={savingEdit}
                style={{ padding: "6px 18px", borderRadius: 6, border: "none", background: "#377DFF", color: "#fff", cursor: "pointer" }}
              >
                {savingEdit ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={savingEdit}
                style={{ padding: "6px 18px", borderRadius: 6, border: "1px solid #ddd", background: "transparent", color: "#666", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          content && (
            <h4 className="_feed_inner_timeline_post_title">{content}</h4>
          )
        )}
        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            {/* Post images have no known intrinsic size, so use Next's
                responsive pattern: 0/0 + sizes + auto height keeps the natural
                aspect ratio while filling the column width. */}
            <Image
              src={post.imageUrl}
              alt=""
              width={0}
              height={0}
              sizes="(max-width: 768px) 100vw, 600px"
              className="_time_img"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}
      </div>
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        {/* Stacked faces: one circle per distinct reaction type present
            (most popular first, like the reference), then the total count —
            clickable to see who reacted and with what. */}
        <div className="_feed_inner_timeline_total_reacts_image">
          {likeCount > 0 && (
            <>
              {reactions.slice(0, 5).map((reaction, index) => (
                <span
                  key={reaction.type}
                  className={index === 0 ? "_react_img1" : "_react_img"}
                  title={`${REACTION_BY_TYPE[reaction.type].label} · ${reaction.count}`}
                  aria-label={REACTION_BY_TYPE[reaction.type].label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  {REACTION_BY_TYPE[reaction.type].emoji}
                </span>
              ))}
              <p className="_feed_inner_timeline_total_reacts_para">
                <Likers
                  count={likeCount}
                  label=""
                  fetcher={(page) => getPostLikers(post.id, page)}
                />
              </p>
            </>
          )}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <a href="#0">
              <span>{commentCount}</span> {commentCount === 1 ? "Comment" : "Comments"}
            </a>
          </p>
        </div>
      </div>
      {/* Action bar, in the reference's order: Like · Comment · Share. The
          Like button hover-reveals the seven-reaction picker; clicking it
          toggles a plain Like. Comment and Share are presentational. */}
      <div className="_feed_inner_timeline_reaction">
        <div
          style={{ position: "relative", flex: "1 1", display: "flex", margin: "0 4px 0 0" }}
          onMouseEnter={openPicker}
          onMouseLeave={closePickerSoon}
        >
          {pickerOpen && (
            <span
              role="menu"
              aria-label="Pick a reaction"
              onMouseEnter={openPicker}
              onMouseLeave={closePickerSoon}
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                marginBottom: 8,
                display: "flex",
                gap: 4,
                padding: "6px 10px",
                background: "#fff",
                borderRadius: 30,
                boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                zIndex: 30,
              }}
            >
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  type="button"
                  role="menuitem"
                  title={reaction.label}
                  aria-label={reaction.label}
                  data-reaction={reaction.type}
                  onClick={() => void applyReaction(reaction.type)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 26,
                    lineHeight: 1,
                    padding: 2,
                    transition: "transform .1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {reaction.emoji}
                </button>
              ))}
            </span>
          )}
          <button
            className={`_feed_inner_timeline_reaction_emoji _feed_reaction${activeReaction ? " _feed_reaction_active" : ""}`}
            onClick={toggleReaction}
            disabled={reactPending}
            aria-haspopup="menu"
            aria-expanded={pickerOpen}
            style={{ flex: "1 1", margin: 0 }}
          >
            <span className="_feed_inner_timeline_reaction_link">
              {" "}
              <span style={activeReaction ? { color: activeReaction.color } : undefined}>
                {activeReaction ? (
                  <span style={{ marginRight: 8, fontSize: 16 }} aria-hidden="true">
                    {activeReaction.emoji}
                  </span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                )}
                {activeReaction ? activeReaction.label : "Like"}
              </span>
            </span>
          </button>
        </div>
        <button className="_feed_inner_timeline_reaction_comment _feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            {" "}
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z"/>
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563"/>
              </svg>
              Comment
            </span>
          </span>
        </button>
        <button className="_feed_inner_timeline_reaction_share _feed_reaction" type="button">
          <span className="_feed_inner_timeline_reaction_link">
            {" "}
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z"/>
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>
      <div className="_feed_inner_timeline_cooment_area">
        <NewCommentForm currentUser={currentUser} onSubmit={submitComment} />
      </div>
      <div className="_timline_comment_main">
        {unseenComments > 0 && (
          <div className="_previous_comment">
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={loadComments}
              disabled={loadingComments}
            >
              {loadingComments
                ? "Loading…"
                : commentsLoaded
                  ? `View ${unseenComments} more ${unseenComments === 1 ? "comment" : "comments"}`
                  : `View ${unseenComments} ${unseenComments === 1 ? "comment" : "comments"}`}
            </button>
          </div>
        )}
        {comments.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}
