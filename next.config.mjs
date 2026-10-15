/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'sharp'],
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '40mb' } },
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icon.svg', permanent: false }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
export default nextConfig;
