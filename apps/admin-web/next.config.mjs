/** @type {import('next').NextConfig} */
const stageCopilotDist = new URL("../../packages/stage-copilot/dist/index.js", import.meta.url).pathname;

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
    "@workflow/synthesis-evaluation",
    "@workflow/packages-output",
    "@workflow/review-issues",
    "@workflow/integrations",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@workflow/stage-copilot": stageCopilotDist,
    };
    return config;
  },
};

export default nextConfig;
