import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WASM build that must stay external to the server bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    // The brand image is AVIF; serve modern formats and cache them hard, since
    // the statue is on nearly every screen and never changes.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    /*
      The statue source is 1366px wide. Next's default device sizes go to 3840,
      so it was generating a 1920px variant and upscaling — larger file, softer
      picture. Capping the ladder at the source width stops that.
    */
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1366],
    imageSizes: [64, 96, 128, 256, 320, 384],
  },
  experimental: {
    // Server Actions carry survey payloads with photo notes; keep a sane ceiling.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
