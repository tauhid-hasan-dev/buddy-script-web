"use client";

import { useState } from "react";

import { fullName, formatRelativeTime } from "@/lib/format";
import {
  createComment,
  getReplies,
  likeComment,
  unlikeComment,
  getCommentLikers,
  type Comment,
} from "@/lib/comments";
import type { AuthUser } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import Likers from "./Likers";

function CommentReplyForm({
  currentUser,
  onSubmit,
  placeholder,
}: {
  currentUser: AuthUser | null;
  onSubmit: (content: string) => Promise<void>;
  placeholder: string;
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
      // Keep the text so the user can retry.
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
              placeholder={placeholder}
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

export default function CommentNode({
  comment: initial,
  currentUser,
  isReply = false,
}: {
  comment: Comment;
  currentUser: AuthUser | null;
  isReply?: boolean;
}) {
  const [likedByMe, setLikedByMe] = useState(initial.likedByMe);
  const [likeCount, setLikeCount] = useState(initial.likeCount);
  const [replyCount, setReplyCount] = useState(initial.replyCount);
  const [likePending, setLikePending] = useState(false);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [repliesCursor, setRepliesCursor] = useState<string | null>(null);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  async function toggleLike() {
    if (likePending) return;
    setLikePending(true);
    const next = !likedByMe;
    // Optimistic flip; reconcile with the authoritative count on response.
    setLikedByMe(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const state = next
        ? await likeComment(initial.id)
        : await unlikeComment(initial.id);
      setLikedByMe(state.liked);
      setLikeCount(state.likeCount);
    } catch {
      setLikedByMe(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    } finally {
      setLikePending(false);
    }
  }

  async function loadReplies() {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const page = await getReplies(initial.id, repliesCursor ?? undefined);
      setReplies((prev) => [...prev, ...page.replies]);
      setRepliesCursor(page.nextCursor);
      setRepliesLoaded(true);
    } catch {
      // Leave the toggle so the user can retry.
    } finally {
      setLoadingReplies(false);
    }
  }

  async function submitReply(content: string) {
    const { comment } = await createComment(initial.postId, content, initial.id);
    setReplies((prev) => [...prev, comment]);
    setReplyCount((c) => c + 1);
    setRepliesLoaded(true);
    setShowReplyForm(false);
  }

  const hiddenReplies = replyCount - replies.length;

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <a href="#0" className="_comment_image_link">
          <Avatar src={initial.author.avatarUrl} name={fullName(initial.author)} className="_comment_img1" size={40} />
        </a>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <a href="#0">
                <h4 className="_comment_name_title">{fullName(initial.author)}</h4>
              </a>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{initial.content}</span>
            </p>
          </div>
          {likeCount > 0 && (
            <div className="_total_reactions">
              <div className="_total_react">
                <span className="_reaction_like">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                </span>
              </div>
              <span className="_total">
                <Likers
                  count={likeCount}
                  label=""
                  fetcher={(page) => getCommentLikers(initial.id, page)}
                />
              </span>
            </div>
          )}
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <span
                    style={{ cursor: "pointer", fontWeight: likedByMe ? 600 : undefined }}
                    onClick={toggleLike}
                  >
                    {likedByMe ? "Liked." : "Like."}
                  </span>
                </li>
                {!isReply && (
                  <li>
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowReplyForm((s) => !s)}
                    >
                      Reply.
                    </span>
                  </li>
                )}
                <li>
                  <span className="_time_link">.{formatRelativeTime(initial.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Replies (one level of nesting on the server). */}
        {!isReply && replyCount > 0 && (
          <div className="_previous_comment" style={{ marginTop: 8 }}>
            {!repliesLoaded || hiddenReplies > 0 ? (
              <button
                type="button"
                className="_previous_comment_txt"
                onClick={loadReplies}
                disabled={loadingReplies}
              >
                {loadingReplies
                  ? "Loading…"
                  : repliesLoaded
                    ? `View ${hiddenReplies} more ${hiddenReplies === 1 ? "reply" : "replies"}`
                    : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
              </button>
            ) : null}
          </div>
        )}

        {replies.map((reply) => (
          <CommentNode
            key={reply.id}
            comment={reply}
            currentUser={currentUser}
            isReply
          />
        ))}

        {showReplyForm && (
          <CommentReplyForm
            currentUser={currentUser}
            placeholder={`Reply to ${initial.author.firstName}…`}
            onSubmit={submitReply}
          />
        )}
      </div>
    </div>
  );
}
