/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@workflow/contracts",
    "@workflow/core-state",
    "@workflow/persistence",
    "@workflow/stage-copilot",
    "@workflow/core-case",
    "@workflow/sources-context",
    "@workflow/prompts",
    "@workflow/sessions-clarification",
    "@workflow/synthesis-evaluation",
    "@workflow/packages-output",
    "@workflow/review-issues",
    "@workflow/integrations",
  ],
};

export default nextConfig;
