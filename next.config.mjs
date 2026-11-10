/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // React Flow and Yjs collaborative drag feel smoother with single mount
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;
