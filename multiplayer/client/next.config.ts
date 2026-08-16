import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // deploy as a static export served by the express/socket.io backend
  output: "export",
  // this app is a standalone client inside a monorepo; pin the turbopack root
  // so it doesn't wander up to the repo's own lockfile
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
