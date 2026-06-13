"use client";

import { useState } from "react";

// Default-avatar palette (in the requested order: blue, green, purple, red).
// A user with no uploaded photo gets their initials on one of these — the
// colour is chosen deterministically from their name, so the same person shows
// the same colour everywhere (navbar, posts, comments, profile) and across
// reloads, with no extra state or backend field.
const PALETTE = ["#377DFF", "#21A366", "#7C5CDB", "#E0414F"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

// "Ava Tester" -> "AT", "Madonna" -> "M". Uppercased first letters of the first
// and last name tokens.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Renders a user's profile image, or — when they have none (avatarUrl null, e.g.
// a freshly registered account) or the stored URL fails to load — a coloured
// initials avatar. Falls back to a neutral silhouette only when no name is known
// yet (e.g. the header before the current user has loaded).
//
// Sizing is explicit (the `size` prop) rather than inherited from the template
// avatar classes, which size a real <img> via wrapper width + `max-width` + the
// global `img { width/height:100% }` rule — none of which apply to the fallback
// <span>. Driving width/height here gives every branch an identical round box,
// and `object-fit: cover` keeps non-square uploads from distorting.
export default function Avatar({
  src,
  name,
  className,
  size = 40,
}: {
  src?: string | null;
  name?: string;
  className?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: "50%" } as const;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        className={className}
        style={{ ...box, objectFit: "cover", display: "block", flex: "0 0 auto" }}
        onError={() => setFailed(true)}
      />
    );
  }

  const initials = initialsOf(name ?? "");

  if (initials) {
    return (
      <span
        className={className}
        role="img"
        aria-label={name}
        style={{
          ...box,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: colorFor(name ?? ""),
          color: "#fff",
          fontWeight: 600,
          fontSize: Math.round(size * 0.42),
          lineHeight: 1,
          letterSpacing: 0.5,
          userSelect: "none",
          overflow: "hidden",
          flex: "0 0 auto",
        }}
      >
        {initials}
      </span>
    );
  }

  // No name yet — neutral silhouette.
  return (
    <span
      className={className}
      role="img"
      aria-label="Default profile photo"
      style={{
        ...box,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e4e9f1",
        color: "#9aa6b8",
        overflow: "hidden",
        flex: "0 0 auto",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        style={{ width: "62%", height: "62%" }}
      >
        <path d="M12 12.6a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Zm0 1.7c-3.5 0-7 1.76-7 4.36V20a.8.8 0 0 0 .8.8h12.4a.8.8 0 0 0 .8-.8v-1.34c0-2.6-3.5-4.36-7-4.36Z" />
      </svg>
    </span>
  );
}
