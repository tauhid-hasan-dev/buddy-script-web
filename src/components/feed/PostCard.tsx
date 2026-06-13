"use client";

import { useState } from "react";

import { fullName, formatRelativeTime } from "@/lib/format";
import {
  deletePost,
  likePost,
  unlikePost,
  getPostLikers,
  type Post,
} from "@/lib/posts";
import {
  getComments,
  createComment,
  type Comment,
} from "@/lib/comments";
import type { AuthUser } from "@/lib/auth";
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
            <img
              src="/assets/images/comment_img.png"
              alt={currentUser ? fullName(currentUser) : ""}
              className="_comment_img"
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
          <button
            type="submit"
            className="_feed_inner_comment_box_icon_btn"
            disabled={pending || !value.trim()}
            aria-busy={pending}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363z" clipRule="evenodd" />
            </svg>
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

  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likePending, setLikePending] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const isOwner = currentUser?.id === post.author.id;

  async function toggleLike() {
    if (likePending) return;
    setLikePending(true);
    const next = !likedByMe;
    setLikedByMe(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const state = next ? await likePost(post.id) : await unlikePost(post.id);
      setLikedByMe(state.liked);
      setLikeCount(state.likeCount);
    } catch {
      setLikedByMe(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    } finally {
      setLikePending(false);
    }
  }

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
              <img src="/assets/images/post_img.png" alt="" className="_post_img" />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {fullName(post.author)}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {formatRelativeTime(post.createdAt)} .{" "}
                <a href="#0">
                  {post.visibility === "PRIVATE" ? "Private" : "Public"}
                </a>
              </p>
            </div>
          </div>
          {isOwner && (
            <div className="_feed_inner_timeline_post_box_dropdown">
              <div className="_feed_timeline_post_dropdown">
                <button
                  type="button"
                  className="_feed_timeline_post_dropdown_link"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                    <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                  </svg>
                </button>
              </div>
              <div className={`_feed_timeline_dropdown _timeline_dropdown${dropdownOpen ? " show" : ""}`}>
                <ul className="_feed_timeline_dropdown_list">
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
                </ul>
              </div>
            </div>
          )}
        </div>
        {post.content && (
          <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>
        )}
        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <img src={post.imageUrl} alt="" className="_time_img" />
          </div>
        )}
      </div>
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          <p className="_feed_inner_timeline_total_reacts_para">
            <Likers
              count={likeCount}
              label={likeCount === 1 ? "Like" : "Likes"}
              fetcher={(page) => getPostLikers(post.id, page)}
            />
          </p>
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <a href="#0">
              <span>{commentCount}</span> {commentCount === 1 ? "Comment" : "Comments"}
            </a>
          </p>
        </div>
      </div>
      <div className="_feed_inner_timeline_reaction">
        <button
          className={`_feed_inner_timeline_reaction_emoji _feed_reaction${likedByMe ? " _feed_reaction_active" : ""}`}
          onClick={toggleLike}
          disabled={likePending}
        >
          <span className="_feed_inner_timeline_reaction_link">
            {" "}
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
              {likedByMe ? "Liked" : "Like"}
            </span>
          </span>
        </button>
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
