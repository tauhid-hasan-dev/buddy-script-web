import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored HTML template the pages are converted from — not source code.
    "reference/**",
  ]),
  // Content images (avatars, post images) use next/image. These files only
  // render decorative template chrome (background SVG shapes, logos, fixed-size
  // story/sidebar thumbnails) sized by the template's CSS classes, plus the
  // local object-URL upload preview in CreatePost — cases where next/image adds
  // no optimization benefit and its required width/height would fight the
  // pixel-matched layout. Keep plain <img> here intentionally.
  {
    files: [
      "src/app/login/page.tsx",
      "src/app/register/page.tsx",
      "src/components/feed/Header.tsx",
      "src/components/feed/MobileHeader.tsx",
      "src/components/feed/LeftSidebar.tsx",
      "src/components/feed/RightSidebar.tsx",
      "src/components/feed/Stories.tsx",
      "src/components/feed/CreatePost.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
