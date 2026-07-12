/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com"
      },
      {
        // GitHub profile URLs (e.g. https://github.com/username.png) redirect to
        // avatars.githubusercontent.com but next/image resolves the *original* hostname.
        protocol: "https",
        hostname: "github.com"
      }
    ]
  }
};

module.exports = nextConfig;
