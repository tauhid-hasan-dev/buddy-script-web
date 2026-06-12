import { api } from "./api";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function register(input: RegisterInput): Promise<{ user: AuthUser }> {
  return api<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput): Promise<{ user: AuthUser }> {
  return api<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ message: string }> {
  return api<{ message: string }>("/api/auth/logout", { method: "POST" });
}

export function getMe(): Promise<{ user: AuthUser }> {
  return api<{ user: AuthUser }>("/api/auth/me");
}
