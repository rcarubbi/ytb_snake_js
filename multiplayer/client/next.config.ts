import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // deploy as a static export served by the express/socket.io backend
  output: "export",
};

export default nextConfig;
