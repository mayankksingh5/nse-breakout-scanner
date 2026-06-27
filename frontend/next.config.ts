import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permanent redirects from the legacy /tasks/* URLs to the new /workspace/*
  // structure. Specific routes first, then a catch-all. /tasks/login → /login.
  async redirects() {
    return [
      { source: "/tasks", destination: "/workspace", permanent: true },
      { source: "/tasks/login", destination: "/login", permanent: true },
      { source: "/tasks/board", destination: "/workspace/tasks", permanent: true },
      { source: "/tasks/table", destination: "/workspace/tasks", permanent: true },
      { source: "/tasks/my", destination: "/workspace/my", permanent: true },
      { source: "/tasks/members", destination: "/workspace/members", permanent: true },
      { source: "/tasks/:path*", destination: "/workspace/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
