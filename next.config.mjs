/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow this app to be embedded as an iframe on STL Partners domains.
          // Replace the domain below with your actual website domain.
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://stlpartners.com https://amqc49rzty-staging.wpdns.site",
          },
          // Remove the SAMEORIGIN default so the CSP above takes effect
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
