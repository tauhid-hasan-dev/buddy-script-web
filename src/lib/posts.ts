import { api } from "./api";

export type Visibility = "PUBLIC" | "PRIVATE";

// Mirrors the server's ReactionType enum. Order matches the picker's
// left-to-right layout (Facebook order).
export type ReactionType =
  | "LIKE"
  | "LOVE"
  | "CARE"
  | "HAHA"
  | "WOW"
  | "SAD"
  | "ANGRY";

// Presentation metadata for each reaction: the emoji shown in the picker and
// the stacked faces, the verb shown on the active button, and the label color
// matching Facebook's palette. Ordered as the picker renders them.
export const REACTIONS: {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}[] = [
  { type: "LIKE", emoji: "👍", label: "Like", color: "#377dff" },
  { type: "LOVE", emoji: "❤️", label: "Love", color: "#f33e58" },
  { type: "CARE", emoji: "🤗", label: "Care", color: "#f7b125" },
  { type: "HAHA", emoji: "😆", label: "Haha", color: "#f7b125" },
  { type: "WOW", emoji: "😮", label: "Wow", color: "#f7b125" },
  { type: "SAD", emoji: "😢", label: "Sad", color: "#f7b125" },
  { type: "ANGRY", emoji: "😡", label: "Angry", color: "#e9710f" },
];

export const REACTION_BY_TYPE: Record<
  ReactionType,
  (typeof REACTIONS)[number]
> = Object.fromEntries(REACTIONS.map((r) => [r.type, r])) as Record<
  ReactionType,
  (typeof REACTIONS)[number]
>;

export interface ReactionCount {
  type: ReactionType;
  count: number;
}

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  // Public URL of the author's avatar, or null → the client shows a default
  // icon (see the shared <Avatar> component).
  avatarUrl: string | null;
}

// Mirrors the server's IPostDto (posts.interface.ts). BigInt ids arrive as
// strings; createdAt as an ISO string over JSON.
export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  visibility: Visibility;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  myReaction: ReactionType | null;
  reactions: ReactionCount[];
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

export interface LikeState {
  liked: boolean;
  likeCount: number;
  myReaction: ReactionType | null;
  reactions: ReactionCount[];
}

export interface LikerEntry {
  likedAt: string;
  type: ReactionType;
  user: PostAuthor;
}

export interface LikersPage {
  likes: LikerEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreatePostInput {
  content: string;
  visibility: Visibility;
  image?: File | null;
}

export function getFeed(cursor?: string, limit = 20): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return api<FeedPage>(`/api/feed?${params.toString()}`);
}

// The mutable slice of a post — reaction tallies and comment count. The live
// poll returns these for posts already on screen so likes/comments update with
// the same latency as a new post, without re-sending unchanged content.
export interface PostState {
  id: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  myReaction: ReactionType | null;
  reactions: ReactionCount[];
}

export interface FeedUpdates {
  posts: Post[];
  updated: PostState[];
  hasMore: boolean;
}

// Live-update poll: posts newer than `after` (the newest post id the client
// already shows), plus refreshed like/comment state for the on-screen post
// `ids`. Hits an uncached endpoint so other users' posts, reactions, and
// comments appear within a poll interval instead of waiting out the feed's
// first-page cache TTL.
export function getFeedUpdates(
  after: string,
  ids: string[] = [],
  limit = 10
): Promise<FeedUpdates> {
  const params = new URLSearchParams({ after, limit: String(limit) });
  if (ids.length > 0) params.set("ids", ids.join(","));
  return api<FeedUpdates>(`/api/feed/updates?${params.toString()}`);
}

export function createPost(input: CreatePostInput): Promise<{ post: Post }> {
  // With an image we must send multipart/form-data; without one, plain JSON
  // is lighter and the server accepts both.
  if (input.image) {
    const form = new FormData();
    form.append("content", input.content);
    form.append("visibility", input.visibility);
    form.append("image", input.image);
    return api<{ post: Post }>("/api/posts", { method: "POST", body: form });
  }

  return api<{ post: Post }>("/api/posts", {
    method: "POST",
    body: JSON.stringify({
      content: input.content,
      visibility: input.visibility,
    }),
  });
}

export interface UpdatePostInput {
  content?: string;
  visibility?: Visibility;
}

export function updatePost(
  id: string,
  input: UpdatePostInput
): Promise<{ post: Post }> {
  return api<{ post: Post }>(`/api/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePost(id: string): Promise<void> {
  return api<void>(`/api/posts/${id}`, { method: "DELETE" });
}

// Set (or change) the viewer's reaction on a post. Defaults to LIKE so a bare
// thumbs-up tap matches the legacy endpoint.
export function reactToPost(
  id: string,
  type: ReactionType = "LIKE"
): Promise<LikeState> {
  return api<LikeState>(`/api/posts/${id}/like`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

// Remove the viewer's reaction entirely.
export function unreactPost(id: string): Promise<LikeState> {
  return api<LikeState>(`/api/posts/${id}/like`, { method: "DELETE" });
}

export function getPostLikers(id: string, page = 1): Promise<LikersPage> {
  return api<LikersPage>(`/api/posts/${id}/likes?page=${page}&limit=20`);
}
