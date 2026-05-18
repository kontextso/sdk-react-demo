import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15 enables React StrictMode in dev, which double-mounts every
  // component. sdk-react@4's <InlineAd> consumes a bid on first mount;
  // the StrictMode cleanup then cancels the iframe load and the second
  // mount can't recover (the bid is already burned). Production builds
  // are unaffected — no double-mount there. Re-enable once sdk-react
  // ships a StrictMode-safe <InlineAd> lifecycle.
  reactStrictMode: false,
};

export default nextConfig;
