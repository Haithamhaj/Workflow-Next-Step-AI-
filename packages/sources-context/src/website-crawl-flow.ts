import type {
  ContentChunkRecord,
  ProviderExtractionJob,
  WebsiteCrawlCandidatePage,
  WebsiteCrawlPlanStatus,
} from "@workflow/contracts";
import type {
  ContentChunkRepository,
  CrawledPageContentRepository,
  EmbeddingJobRepository,
  AIIntakeSuggestionRepository,
  IntakeSourceRepository,
  ProviderExtractionJobRepository,
  StoredContentChunkRecord,
  StoredCrawledPageContent,
  StoredProviderExtractionJob,
  StoredWebsiteCrawlApproval,
  StoredWebsiteCrawlPlan,
  StoredWebsiteCrawlSiteSummary,
  TextArtifactRepository,
  WebsiteCrawlApprovalRepository,
  WebsiteCrawlPlanRepository,
  WebsiteCrawlSiteSummaryRepository,
} from "@workflow/persistence";
import type { CrawlProvider, DiscoveredPage } from "@workflow/integrations";
import type { EmbeddingProvider } from "@workflow/integrations";
import { runEmbeddingJob } from "./provider-jobs.js";

export const WEBSITE_CRAWL_MAX_PAGE_OPTIONS = [20, 30, 40, 50] as const;
export const DEFAULT_WEBSITE_CRAWL_MAX_PAGES = 20;

export interface WebsiteCrawlFlowRepos {
  intakeSources: IntakeSourceRepository;
  providerJobs: ProviderExtractionJobRepository;
  textArtifacts: TextArtifactRepository;
  embeddingJobs: EmbeddingJobRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  websiteCrawlPlans: WebsiteCrawlPlanRepository;
  websiteCrawlApprovals: WebsiteCrawlApprovalRepository;
  crawledPageContents: CrawledPageContentRepository;
  websiteCrawlSiteSummaries: WebsiteCrawlSiteSummaryRepository;
  contentChunks: ContentChunkRepository;
}

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function assertMaxPages(maxPages: number): number {
  if (!WEBSITE_CRAWL_MAX_PAGE_OPTIONS.includes(maxPages as 20 | 30 | 40 | 50)) {
    throw new Error("Website crawl maxPages must be one of 20, 30, 40, or 50.");
  }
  return maxPages;
}

function status(plan: StoredWebsiteCrawlPlan, nextStatus: WebsiteCrawlPlanStatus, errorMessage?: string): StoredWebsiteCrawlPlan {
  return {
    ...plan,
    status: nextStatus,
    errorMessage,
    updatedAt: now(),
  };
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function hasQuery(url: string): boolean {
  try {
    return new URL(url).search.length > 0;
  } catch {
    return false;
  }
}

function classify(url: string, index: number): { reason: string; included: boolean; exclusionReason?: string } {
  const path = pathOf(url);
  if (hasQuery(url)) return { reason: "Duplicate query-param URL", included: false, exclusionReason: "duplicate query-param URL" };
  if (/\/(login|signin|sign-in|signup|register)(\/|$)/.test(path)) return { reason: "Login/signup page", included: false, exclusionReason: "login/signup page" };
  if (/\/(privacy|cookie|cookies)(\/|$)/.test(path)) return { reason: "Utility-only privacy/cookie page", included: false, exclusionReason: "utility-only privacy/cookie page" };
  if (/\/(blog|news)(\/|$)/.test(path)) return { reason: "Blog/news archive page", included: false, exclusionReason: "blog/news archive page" };
  if (/\/(career|careers|jobs)(\/|$)/.test(path)) return { reason: "Careers/jobs page", included: false, exclusionReason: "careers/jobs page" };
  if (/\/(gallery|media)(\/|$)/.test(path)) return { reason: "Media gallery-only page", included: false, exclusionReason: "media gallery-only page" };
  if (/\/(en|ar|fr|es|de)(\/|$)/.test(path) && index > 0) return { reason: "Possible duplicate language variant", included: false, exclusionReason: "duplicate language variant" };
  if (path === "/" || path === "") return { reason: "Homepage priority", included: true };
  if (/about/.test(path)) return { reason: "About/company identity priority", included: true };
  if (/(services|solutions)/.test(path)) return { reason: "Services/solutions priority", included: true };
  if (/(department|departments|team|teams|organization|organisation|unit|units)/.test(path)) return { reason: "Departments/teams/organization priority", included: true };
  if (/(policy|policies|terms|sla|service-level)/.test(path)) return { reason: "Policies/terms/SLA priority", included: true };
  if (/contact/.test(path)) return { reason: "Contact priority", included: true };
  if (/(project|projects|case-stud|portfolio)/.test(path)) return { reason: "Projects/case studies/portfolio priority", included: true };
  if (/(client|clients|customer|customers|partner|partners)/.test(path)) return { reason: "Client/customer/partner priority", included: true };
  return { reason: "General same-domain page", included: index < 5 };
}

function toCandidate(page: DiscoveredPage, index: number): WebsiteCrawlCandidatePage {
  const classified = classify(page.url, index);
  const included = classified.included && !page.excluded;
  return {
    url: page.url,
    pageTitle: page.title,
    priorityReason: page.exclusionReason ?? classified.reason,
    defaultIncluded: included,
    adminIncluded: included,
    exclusionReason: page.exclusionReason ?? classified.exclusionReason,
  };
}

function chunkText(page: StoredCrawledPageContent): StoredContentChunkRecord[] {
  const size = 1200;
  const text = page.textContent.trim();
  if (!text) return [];
  const chunks: ContentChunkRecord[] = [];
  for (let start = 0, index = 0; start < text.length; start += size, index += 1) {
    chunks.push({
      chunkId: id("chunk"),
      crawlPlanId: page.crawlPlanId,
      sourceId: page.sourceId,
      pageContentId: page.pageContentId,
      url: page.url,
      chunkIndex: index,
      text: text.slice(start, start + size),
      createdAt: now(),
    });
  }
  return chunks;
}

export async function createWebsiteCrawlPlan(input: {
  sourceId: string;
  maxPages?: number;
  crawlProvider: CrawlProvider;
  repos: WebsiteCrawlFlowRepos;
}): Promise<StoredWebsiteCrawlPlan> {
  const source = input.repos.intakeSources.findById(input.sourceId);
  if (!source) throw new Error(`Intake source not found: ${input.sourceId}`);
  if (source.inputType !== "website_url" || !source.websiteUrl) {
    throw new Error("Website crawl plans can only be created for website_url intake sources.");
  }
  const timestamp = now();
  const maxPages = assertMaxPages(input.maxPages ?? DEFAULT_WEBSITE_CRAWL_MAX_PAGES);
  let plan: StoredWebsiteCrawlPlan = {
    crawlPlanId: id("crawlplan"),
    sourceId: source.sourceId,
    sessionId: source.sessionId,
    caseId: source.caseId,
    baseUrl: source.websiteUrl,
    maxPages,
    status: "discovery_pending",
    candidatePages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.websiteCrawlPlans.save(plan);
  try {
    const discovered = await input.crawlProvider.discoverPages(source.websiteUrl, maxPages);
    plan = {
      ...plan,
      status: "awaiting_admin_approval",
      candidatePages: discovered.slice(0, maxPages).map(toCandidate),
      updatedAt: now(),
    };
  } catch (error) {
    plan = status(plan, "discovery_failed", error instanceof Error ? error.message : String(error));
  }
  input.repos.websiteCrawlPlans.save(plan);
  return plan;
}

export function approveWebsiteCrawlPlan(input: {
  crawlPlanId: string;
  approvedUrls: string[];
  rejectedUrls?: string[];
  repos: WebsiteCrawlFlowRepos;
}): { plan: StoredWebsiteCrawlPlan; approval: StoredWebsiteCrawlApproval } {
  const plan = input.repos.websiteCrawlPlans.findById(input.crawlPlanId);
  if (!plan) throw new Error(`Website crawl plan not found: ${input.crawlPlanId}`);
  const approved = Array.from(new Set(input.approvedUrls.filter(Boolean)));
  const rejected = Array.from(new Set(input.rejectedUrls ?? []));
  const existingByUrl = new Map(plan.candidatePages.map((page) => [page.url, page]));
  const candidatePages = [
    ...plan.candidatePages.map((page) => ({
      ...page,
      adminIncluded: approved.includes(page.url),
      exclusionReason: rejected.includes(page.url) ? "admin rejected" : page.exclusionReason,
    })),
    ...approved
      .filter((url) => !existingByUrl.has(url))
      .map((url) => ({
        url,
        pageTitle: "Admin-added URL",
        priorityReason: "Admin-added page for crawl approval",
        defaultIncluded: false,
        adminIncluded: true,
      })),
  ];
  const updatedPlan: StoredWebsiteCrawlPlan = {
    ...plan,
    candidatePages,
    status: approved.length > 0 ? "approved" : "rejected",
    errorMessage: approved.length > 0 ? undefined : "No approved URLs remain in the crawl plan.",
    updatedAt: now(),
  };
  const approval: StoredWebsiteCrawlApproval = {
    approvalId: id("crawlapproval"),
    crawlPlanId: plan.crawlPlanId,
    sourceId: plan.sourceId,
    approvedUrls: approved,
    rejectedUrls: rejected,
    createdAt: now(),
  };
  input.repos.websiteCrawlPlans.save(updatedPlan);
  input.repos.websiteCrawlApprovals.save(approval);
  return { plan: updatedPlan, approval };
}

function createCrawlJob(plan: StoredWebsiteCrawlPlan): StoredProviderExtractionJob {
  const timestamp = now();
  return {
    jobId: id("pjob"),
    sourceId: plan.sourceId,
    sessionId: plan.sessionId,
    caseId: plan.caseId,
    provider: "crawl4ai",
    jobKind: "website_crawl",
    status: "queued",
    inputType: "website_url",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function runApprovedWebsiteCrawl(input: {
  crawlPlanId: string;
  crawlProvider: CrawlProvider;
  embeddingProvider: EmbeddingProvider | null;
  repos: WebsiteCrawlFlowRepos;
}): Promise<{
  plan: StoredWebsiteCrawlPlan;
  crawlJob: StoredProviderExtractionJob;
  pages: StoredCrawledPageContent[];
  summary: StoredWebsiteCrawlSiteSummary | null;
  chunks: StoredContentChunkRecord[];
}> {
  const plan = input.repos.websiteCrawlPlans.findById(input.crawlPlanId);
  if (!plan) throw new Error(`Website crawl plan not found: ${input.crawlPlanId}`);
  const approval = input.repos.websiteCrawlApprovals.findByCrawlPlanId(plan.crawlPlanId);
  if (!approval || plan.status !== "approved") {
    throw new Error("Website crawl cannot run before admin approval is persisted.");
  }

  const job = createCrawlJob(plan);
  input.repos.providerJobs.save(job);
  const runningJob: StoredProviderExtractionJob = { ...job, status: "running", updatedAt: now() };
  input.repos.providerJobs.save(runningJob);
  const crawlingPlan = status(plan, "crawling");
  input.repos.websiteCrawlPlans.save(crawlingPlan);

  try {
    const crawled = await input.crawlProvider.crawlPages(approval.approvedUrls);
    const successful = crawled.filter((page) => page.statusCode >= 200 && page.statusCode < 300 && page.textContent.trim());
    if (successful.length === 0) {
      throw new Error("Crawl4AI returned no successful pages with extracted text.");
    }

    const pages = successful.map((page): StoredCrawledPageContent => ({
      pageContentId: id("crawlpage"),
      crawlPlanId: plan.crawlPlanId,
      sourceId: plan.sourceId,
      url: page.url,
      pageTitle: page.title,
      statusCode: page.statusCode,
      textContent: page.textContent,
      createdAt: now(),
    }));
    pages.forEach((page) => input.repos.crawledPageContents.save(page));

    const summary: StoredWebsiteCrawlSiteSummary = {
      summaryId: id("crawlsummary"),
      crawlPlanId: plan.crawlPlanId,
      sourceId: plan.sourceId,
      summary: await input.crawlProvider.generateSiteSummary(successful),
      createdAt: now(),
    };
    input.repos.websiteCrawlSiteSummaries.save(summary);

    const chunks = pages.flatMap(chunkText);
    chunks.forEach((chunk) => input.repos.contentChunks.save(chunk));
    for (const chunk of chunks) {
      await runEmbeddingJob({
        embeddingProvider: input.embeddingProvider,
        repos: input.repos,
        sourceId: plan.sourceId,
        sampleText: chunk.text,
        chunkRefs: [chunk.chunkId],
      });
    }

    const succeededJob: StoredProviderExtractionJob = {
      ...runningJob,
      status: "succeeded",
      outputRef: summary.summaryId,
      updatedAt: now(),
    };
    input.repos.providerJobs.save(succeededJob);
    const completedPlan = status(crawlingPlan, "completed");
    input.repos.websiteCrawlPlans.save(completedPlan);
    return { plan: completedPlan, crawlJob: succeededJob, pages, summary, chunks };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedJob: StoredProviderExtractionJob = {
      ...runningJob,
      status: "failed",
      errorMessage: message,
      updatedAt: now(),
    };
    input.repos.providerJobs.save(failedJob);
    const failedPlan = status(crawlingPlan, "crawl_failed", message);
    input.repos.websiteCrawlPlans.save(failedPlan);
    return { plan: failedPlan, crawlJob: failedJob, pages: [], summary: null, chunks: [] };
  }
}
