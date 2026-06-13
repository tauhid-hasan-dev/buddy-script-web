"use client";

import { useState } from "react";

// Renders a user's profile image, or a neutral default silhouette when they
// have none (avatarUrl null) — or when the stored URL fails to load.
//
// Sizing is explicit (the `size` prop) rather than inherited from the template
// avatar classes: those size a real <img> via wrapper width + `max-width` + the
// global `img { width/height:100% }` rule, none of which apply to the default
// <span>, so it would otherwise collapse. Driving width/height here gives both
// branches an identical, perfectly round box, and `object-fit: cover` keeps
// non-square uploads from distorting. `className` is still forwarded for slot
// styling (e.g. the profile page's border).
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

  return (
    <span
      className={className}
      role="img"
      aria-label={name ? `${name} — no profile photo` : "Default profile photo"}
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
