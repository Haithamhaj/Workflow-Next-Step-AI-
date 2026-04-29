/**
 * Pass 2 Phase 1 — website crawl contracts.
 * Source of truth: src/schemas/website-crawl-*.schema.json.
 *
 * Actual crawling is out of Phase 1 scope. Contracts and persistence exist
 * so later phases can plan, approve, and summarize crawls durably.
 */

export type WebsiteCrawlPlanStatus =
  | "draft"
  | "approved"
  | "running"
  | "completed"
  | "cancelled";

export type SourceLineageStatus = "active" | "previous" | "superseded" | "stale";

export interface WebsiteCrawlPlan {
  crawlPlanId: string;
  companyId: string;
  caseId: string;
  sourceId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  intakeBatchId?: string;
  seedUrls: string[];
  maxPages: number;
  maxDepth: number;
  plannedBy: string;
  plannedAt: string;
  status: WebsiteCrawlPlanStatus;
  notes?: string;
}

export type WebsiteCrawlCandidateStatus =
  | "discovered"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "fetched";

export interface WebsiteCrawlCandidatePage {
  candidatePageId: string;
  crawlPlanId: string;
  url: string;
  title?: string;
  depth: number;
  discoveredAt: string;
  previewRef?: string;
  status: WebsiteCrawlCandidateStatus;
}

export type WebsiteCrawlApprovalDecision = "approve" | "reject";

export interface WebsiteCrawlApproval {
  approvalId: string;
  companyId: string;
  crawlPlanId: string;
  caseId: string;
  sourceId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  candidatePageId: string;
  decidedBy: string;
  decidedAt: string;
  decision: WebsiteCrawlApprovalDecision;
  reason?: string;
}

export interface WebsiteSiteSummary {
  siteSummaryId: string;
  crawlPlanId: string;
  companyId: string;
  caseId: string;
  sourceId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  siteRootUrl: string;
  totalPagesDiscovered: number;
  totalPagesApproved: number;
  totalPagesFetched: number;
  summaryRef?: string;
  createdAt: string;
}
