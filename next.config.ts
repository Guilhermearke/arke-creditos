import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
