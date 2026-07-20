/** @type {import('next').NextConfig} */
const googleScript = "https://accounts.google.com";
const googleApi = "https://*.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com";
const googleImg = "https://*.googleusercontent.com https://accounts.google.com https://*.gstatic.com";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // No unsafe-inline for scripts; Google Identity Services is allowlisted.
  // unsafe-eval is required for Next.js dev-mode Webpack HMR.
  `script-src 'self' ${googleScript} ${googleApi} 'unsafe-inline' 'unsafe-eval'`,
  // Styles kept permissive (low risk; Next injects inline <style> in prod).
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https: ${googleImg}`,
  "font-src 'self' data:",
  `connect-src 'self' http://localhost:8000 https://localhost:8000 https://oauth2.googleapis.com https://www.googleapis.com`,
  `frame-src ${googleScript}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;