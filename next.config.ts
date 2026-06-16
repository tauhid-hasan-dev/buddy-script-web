import type { NextConfig } from "next";

// All /api requests are proxied to the Express server so its httpOnly auth
// cookie is set first-party on this origin: no cross-site cookie handling in
// the browser, and proxy.ts can read it for route protection.
// Defaults to the deployed API; set API_URL=http://localhost:5000 in
// .env.local to develop against a local server.
const API_URL =
  process.env.API_URL ?? "https://buddy-script-server-iota.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
  images: {
    // User avatars and post images are served as Supabase Storage public URLs
    // (https://<project>.supabase.co/storage/v1/object/public/<bucket>/...).
    // next/image needs every remote host explicitly allow-listed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
