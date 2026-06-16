import { getServerUser } from "@/lib/server-auth";
import { CurrentUserProvider } from "@/lib/currentUser";

// Shared layout for the signed-in pages (feed, profile). It persists across
// navigation between them, so the user cache below isn't torn down and the
// avatar never drops to its fallback when moving feed ↔ profile.
//
// Seeding `initialUser` from the cookie here means the avatar and name are in
// the server-rendered HTML — no fetch-then-photo flash on a hard reload.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getServerUser();
  return (
    <CurrentUserProvider initialUser={initialUser}>
      {children}
    </CurrentUserProvider>
  );
}
