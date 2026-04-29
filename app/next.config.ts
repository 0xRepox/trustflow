import type { NextConfig } from "next";

const securityHeaders = [
  // X-Frame-Options omitted — frame-ancestors in CSP takes precedence in modern browsers
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "connect-src 'self' https://rpc.testnet.arc.network https://trustflow-production.up.railway.app wss://relay.walletconnect.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      "frame-ancestors https://your-merchant-site.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  headers: () => Promise.resolve([{ source: "/(.*)", headers: securityHeaders }]),
};

export default nextConfig;
