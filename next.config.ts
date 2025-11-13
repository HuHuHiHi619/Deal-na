import type { NextConfig } from "next";

const nextConfig: NextConfig = {
     reactStrictMode: false,
     images: {
    domains: [
      'platform-lookaside.fbsbx.com', // Facebook profile pics
      'lh3.googleusercontent.com',   // Google profile pics
    ],
  },
};

export default nextConfig;
