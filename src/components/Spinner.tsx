// Self-contained loading spinner. The rotation is driven by SVG SMIL
// (<animateTransform>), so it needs no global CSS and works in both server
// and client components. Defaults to `currentColor` so it inherits the
// surrounding text colour — visible on white areas, coloured buttons and dark
// overlays alike; pass `color` to force a specific shade (e.g. brand blue).
export default function Spinner({
  size = 36,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      role="status"
      aria-label="Loading"
      style={{ display: "block" }}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="90 60"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
