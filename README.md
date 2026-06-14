# Buddy Script Web

Next.js 16 (App Router) frontend for the **Buddy Script** social feed. It is a
conversion of the static HTML templates in `reference/` into a React app wired
to the [Express API](../buddy-script-server/README.md): auth, a paginated feed,
posts with image uploads, Facebook-style reactions, one-level-nested comments,
and profile/avatar management.

```bash
npm run dev      # next dev → http://localhost:3000
npm run build    # next build
npm run lint     # eslint
```

By default the app talks to the **deployed** API
(`https://buddy-script-server-bqsy.onrender.com`). To develop against a local
server, create `.env.local`:

```bash
API_URL=http://localhost:5000
```

> **Next.js 16 is newer than most tooling/training data.** APIs and file
> conventions differ from older versions — see `AGENTS.md` and the bundled
> guides in `node_modules/next/dist/docs/` before changing framework code.

---

## What was built

| Route | Auth | Description |
| ----- | ---- | ----------- |
| `/` | — | Redirects to `/register` (or `/feed` when signed in) |
| `/register` | guest | Sign-up form |
| `/login` | guest | Sign-in form (supports `?next=` redirect-back) |
| `/feed` | user | Global timeline: create post, react, comment, edit/delete own posts |
| `/profile` | user | View/update own profile name and avatar |

Feature surface integrated against the API:

- **Auth** — register, login, logout, `me`. Forms mirror the server's Zod rules
  for instant feedback (`src/lib/validation.ts`) while the server stays the
  authority.
- **Feed** — cursor-paginated ("Load more"), current user + first page loaded
  together. New posts are prepended optimistically; deleted posts removed in
  place — no refetch.
- **Posts** — create (JSON, or multipart when an image is attached), edit own
  `content`/`visibility`, delete own. `PUBLIC`/`PRIVATE` visibility honored.
- **Reactions** — the seven server reaction types (`LIKE, LOVE, CARE, HAHA,
  WOW, SAD, ANGRY`) with a hover picker, stacked-faces summary, and a likers
  list. Reaction metadata (emoji/label/color, Facebook order) lives in
  `src/lib/posts.ts`.
- **Comments** — top-level comments (newest-first) with one level of replies
  (oldest-first), plus binary comment likes — matching the server's shapes.
- **Profile/avatar** — update name, upload/remove avatar (multipart). A shared
  `<Avatar>` renders the default icon when `avatarUrl` is `null`.

---

## Architecture & key decisions

### Same-origin API via a Next rewrite (not cross-site fetch)
`next.config.ts` rewrites `/api/:path*` to the Express server. The browser only
ever calls **relative** `/api/...` paths, so the API's httpOnly `token` cookie
is **first-party** on this origin. This is the central decision the rest follows
from:

- No CORS/`SameSite=None` cookie juggling in the browser.
- `src/proxy.ts` (Next 16's middleware) can read the cookie for routing.
- `src/lib/api.ts` uses `credentials: "same-origin"` — never calls the API
  origin directly.

### Optimistic, JS-invisible auth (`src/proxy.ts`)
Middleware does an **optimistic** check (cookie present?) only — the JWT is
issued and verified by the API. Guests are bounced from `/feed`/`/profile` to
`/login?next=...`; signed-in users are kept off `/`, `/login`, `/register`. A
stale/forged cookie may reach `/feed`, but every API call it makes still returns
401, so this is a UX shortcut, not the security boundary. Keeping the token in
an httpOnly cookie (never localStorage) means an XSS bug can't read it.

### One typed fetch wrapper (`src/lib/api.ts`)
`api<T>()` is the single entry point for every request. It:
- maps the API's error shape (`{ error }`, plus `{ details: [{field, message}] }`
  for Zod 400s) into a typed `ApiError` with per-field `fieldErrors`, so forms
  can show field-level messages with the same wording as the server;
- JSON-encodes **string** bodies only — `FormData` (image/avatar uploads) is
  left untouched so the browser sets the multipart boundary;
- turns network failures into a friendly `ApiError(status 0)`.

Per-domain modules (`auth.ts`, `posts.ts`, `comments.ts`, `users.ts`) wrap it
with typed functions whose interfaces **mirror the server DTOs** — BigInt ids
arrive as strings, timestamps as ISO strings, exactly as the API serializes
them.

### Template CSS, not Tailwind
Pages import the template's own CSS (`src/styles/{bootstrap.min,common,main,
responsive}.css`) and match the reference markup's `_underscore`-prefixed class
names exactly. Tailwind v4 is installed but used only for small utilities in
`layout.tsx` — template markup is **not** migrated to Tailwind. Images are
served from `public/assets/images/` (copied from `reference/assets/images/`),
and `next/image` allow-lists Supabase Storage hosts (`*.supabase.co`) for remote
avatars/post images.

### Validation mirrors the server
`src/lib/validation.ts` reproduces the server's auth rules (name ≤ 50, email
format/length, password 8–72 bytes) so a doomed request never leaves the
browser. The server remains the single source of truth; this only saves a round
trip and matches the messages.

---

## Project layout

```
src/
  app/
    layout.tsx            # imports template CSS, small Tailwind utilities
    page.tsx              # / → redirects
    login/ register/      # auth pages
    feed/                 # the timeline page
    profile/              # own profile page
  proxy.ts                # Next 16 middleware: optimistic auth routing
  components/
    auth/                 # LoginForm, RegisterForm (mirror server Zod rules)
    feed/                 # Feed, PostCard, CreatePost, CommentNode, Likers,
                          # Header, sidebars, Stories, mobile nav
    profile/ProfileView   # name + avatar management
    Avatar.tsx            # shared avatar with null → default icon
  lib/
    api.ts                # typed fetch wrapper → ApiError
    auth.ts posts.ts      # per-domain API clients, DTO-mirroring types
    comments.ts users.ts
    validation.ts         # client mirror of server auth rules
    format.ts             # display helpers (e.g. relative time)
  styles/                 # template CSS (source of truth for look)
reference/                # original static HTML/CSS templates (markup source)
public/assets/images/     # template images
next.config.ts            # /api rewrite + Supabase image hosts
```

The full API contract, security model, and scale rationale this frontend
consumes are documented in [`buddy-script-server/README.md`](../buddy-script-server/README.md).
