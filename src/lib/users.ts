import { api } from "./api";
import type { AuthUser } from "./auth";

// Profile + avatar calls. All target the authenticated user (/me); the server
// derives identity from the JWT cookie, never from anything the client sends.

export function updateProfile(input: {
  firstName?: string;
  lastName?: string;
}): Promise<{ user: AuthUser }> {
  return api<{ user: AuthUser }>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Multipart upload — leave Content-Type unset so the browser adds the boundary
// (see the api() wrapper, which only JSON-encodes string bodies).
export function uploadAvatar(file: File): Promise<{ user: AuthUser }> {
  const form = new FormData();
  form.append("avatar", file);
  return api<{ user: AuthUser }>("/api/users/me/avatar", {
    method: "POST",
    body: form,
  });
}

export function removeAvatar(): Promise<{ user: AuthUser }> {
  return api<{ user: AuthUser }>("/api/users/me/avatar", { method: "DELETE" });
}
