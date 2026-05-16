import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (apiBase) return [];
    return [
      { source: "/api/:path*", destination: "http://localhost:8080/api/:path*" },
    ];
  },
  webpack(config) {
    config.module.rules.push({ test: /ui_design[\\/]/, loader: "ignore-loader" });
    return config;
  },
};

export default config;
