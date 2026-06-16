"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getMe, type AuthUser } from "./auth";

// App-wide cache of the signed-in user, shared by the Header, feed and profile.
//
// It lives in the (app) route-group layout, which persists across navigation
// (feed ↔ profile) — so the user isn't re-fetched per route, and the avatar
// never drops to its fallback mid-navigation. The layout seeds `initialUser`
// from the server (see getServerUser), so a hard reload renders the avatar in
// the SSR HTML with no flash.
//
// State is held in React (per render / per request), not at module scope, so it
// never leaks between users during server rendering.
interface CurrentUserValue {
  user: AuthUser | null;
  /** True only while a client-side recovery fetch is in flight. */
  loading: boolean;
  /** Replace the cached user (avatar upload, profile edit). */
  setUser: (user: AuthUser | null) => void;
  /** Drop the cached user on logout. */
  clear: () => void;
}

const CurrentUserContext = createContext<CurrentUserValue | null>(null);

export function CurrentUserProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  // The guard (proxy.ts) only lets authenticated requests reach these pages, so
  // a null seed here means the server-side /me fetch failed transiently — try
  // once more from the client. A genuinely present user needs no fetch.
  const [loading, setLoading] = useState(initialUser === null);

  useEffect(() => {
    if (initialUser !== null) return;
    let cancelled = false;
    getMe()
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch(() => {
        // Stale/invalid cookie — leave the user null.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const clear = useCallback(() => setUser(null), []);

  return (
    <CurrentUserContext.Provider value={{ user, loading, setUser, clear }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserValue {
  const value = useContext(CurrentUserContext);
  if (!value) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return value;
}
