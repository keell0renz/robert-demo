import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Mounts the eve agent's HTTP routes (/eve/v1/*) on this app's origin and boots
// the eve dev server alongside `next dev`. The browser only ever talks to Next.
export default withEve(nextConfig);
