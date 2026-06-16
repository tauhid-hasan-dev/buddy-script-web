// Self-contained loading spinner. The rotation is driven by SVG SMIL
// (<animateTransform>), so it needs no global CSS and works in both server
// and client components. Brand blue matches the app's primary accent.
export default function Spinner({ size = 36 }: { size?: number }) {
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
        stroke="#377dff"
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
