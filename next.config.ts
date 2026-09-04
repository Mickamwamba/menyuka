import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/**
 * Next blocks dev resources requested from any origin but localhost, which
 * silently breaks hydration when you open the dev server from a phone on the
 * same wifi — the page renders, but nothing responds to taps. Testing this app
 * on a real phone is the entire point, so every LAN address of this machine is
 * allowed in dev. Computed rather than hardcoded so it survives changing wifi.
 */
const lanOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
  .map((entry) => entry!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigins,
};

export default nextConfig;
