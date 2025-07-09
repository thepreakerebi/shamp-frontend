import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "cdn.browser-use.com",
      "res.cloudinary.com",
      "www.google.com", // For favicon fallbacks
    ],
  },
};

export default nextConfig;
