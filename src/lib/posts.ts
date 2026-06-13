import { api } from "./api";

export type Visibility = "PUBLIC" | "PRIVATE";

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
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
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

export interface LikeState {
  liked: boolean;
  likeCount: number;
}

export interface LikerEntry {
  likedAt: string;
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

export function deletePost(id: string): Promise<void> {
  return api<void>(`/api/posts/${id}`, { method: "DELETE" });
}

export function likePost(id: string): Promise<LikeState> {
  return api<LikeState>(`/api/posts/${id}/like`, { method: "POST" });
}

export function unlikePost(id: string): Promise<LikeState> {
  return api<LikeState>(`/api/posts/${id}/like`, { method: "DELETE" });
}

export function getPostLikers(id: string, page = 1): Promise<LikersPage> {
  return api<LikersPage>(`/api/posts/${id}/likes?page=${page}&limit=20`);
}
