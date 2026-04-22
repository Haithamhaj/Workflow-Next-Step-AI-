/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@workflow/contracts",
    "@workflow/core-state",
    "@workflow/persistence",
    "@workflow/core-case",
    "@workflow/sources-context",
    "@workflow/prompts",
    "@workflow/sessions-clarification",
  ],
};

export default nextConfig;
