/** @type {import('next').NextConfig} */
const databaseFiles = [
  "./prisma/dev.db",
  "./node_modules/.prisma/client/**/*",
  "./node_modules/@prisma/client/**/*",
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    outputFileTracingIncludes: {
      "/**": databaseFiles,
      "/api/**": databaseFiles,
    },
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
