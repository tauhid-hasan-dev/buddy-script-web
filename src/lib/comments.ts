import { api } from "./api";
import type { PostAuthor } from "./posts";

// Comment likes are a simple binary like (reactions are a post-only feature),
// so they keep their own shapes rather than reusing the post LikeState.
export interface CommentLikeState {
  liked: boolean;
  likeCount: number;
}

export interface CommentLikerEntry {
  likedAt: string;
  user: PostAuthor;
}

export interface CommentLikersPage {
  likes: CommentLikerEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Mirrors the server's ICommentDto (comments.interface.ts). A null parentId is
// a top-level comment; a set parentId is a reply (one level of nesting only).
export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
}

export interface CommentsPage {
  comments: Comment[];
  nextCursor: string | null;
}

export interface RepliesPage {
  replies: Comment[];
  nextCursor: string | null;
}

// Top-level comments, newest first, cursor-paginated.
export function getComments(
  postId: string,
  cursor?: string,
  limit = 10
): Promise<CommentsPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return api<CommentsPage>(`/api/posts/${postId}/comments?${params.toString()}`);
}

export function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ comment: Comment }> {
  return api<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(parentId ? { content, parentId } : { content }),
  });
}

// Replies read oldest-first (conversation order).
export function getReplies(
  commentId: string,
  cursor?: string,
  limit = 10
): Promise<RepliesPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return api<RepliesPage>(`/api/comments/${commentId}/replies?${params.toString()}`);
}

export function likeComment(id: string): Promise<CommentLikeState> {
  return api<CommentLikeState>(`/api/comments/${id}/like`, { method: "POST" });
}

export function unlikeComment(id: string): Promise<CommentLikeState> {
  return api<CommentLikeState>(`/api/comments/${id}/like`, { method: "DELETE" });
}

export function getCommentLikers(id: string, page = 1): Promise<CommentLikersPage> {
  return api<CommentLikersPage>(`/api/comments/${id}/likes?page=${page}&limit=20`);
}
