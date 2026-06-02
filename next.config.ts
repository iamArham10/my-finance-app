import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  onDemandEntries: {
    // Increase the period (in ms) that the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously in memory
    pagesBufferLength: 5,
  },
};

export default nextConfig;
