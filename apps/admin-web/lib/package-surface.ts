import type { AdminApprovalStatus, InitialPackageStatus } from "@workflow/contracts";
import type {
  Case,
  InMemoryStore,
  StoredFinalPackageRecord,
  StoredInitialPackageRecord,
  StoredReviewIssueRecord,
} from "@workflow/persistence";

export type PackageSurfaceKind = "final_package" | "initial_preview";

export interface PackageSurfaceCaseContext {
  caseId: string;
  useCaseLabel: string;
  domain: string;
  mainDepartment: string;
  subDepartment?: string;
}

export interface PackageSurfaceListItem {
  id: string;
  kind: PackageSurfaceKind;
  title: string;
  subtitle: string;
  caseContext: PackageSurfaceCaseContext;
  packageStateLabel: string;
  releaseStateLabel: string;
  reviewVisibilityLabel: string;
  reviewItemCount: number;
  packageUpdatedAt: string;
  linkedInitialPackageId?: string;
  linkedFinalPackageId?: string;
  downloadHref: string;
}

export interface PackageSurfaceDetail {
  id: string;
  kind: PackageSurfaceKind;
  title: string;
  subtitle: string;
  caseContext: PackageSurfaceCaseContext;
  initialPackage: StoredInitialPackageRecord;
  finalPackage: StoredFinalPackageRecord | null;
  reviewIssues: StoredReviewIssueRecord[];
  downloadHref: string;
  adminReleaseHref?: string;
}

function toCaseContext(record: Case | null, fallbackCaseId: string): PackageSurfaceCaseContext {
  if (record === null) {
    return {
      caseId: fallbackCaseId,
      useCaseLabel: fallbackCaseId,
      domain: "Unknown domain",
      mainDepartment: "Unknown department",
    };
  }

  return {
    caseId: record.caseId,
    useCaseLabel: record.useCaseLabel,
    domain: record.domain,
    mainDepartment: record.mainDepartment,
    subDepartment: record.subDepartment,
  };
}

function releaseLabel(
  finalPackage: StoredFinalPackageRecord | null,
  initialStatus: InitialPackageStatus,
): string {
  if (finalPackage === null) {
    return initialStatus === "review_recommended"
      ? "Review visible"
      : "Preview available";
  }

  switch (finalPackage.packageReleaseState) {
    case "released":
      return "Released";
    case "approved_for_release":
      return "Approved for release";
    case "pending_admin_approval":
      return "Pending admin approval";
    case "not_releasable":
      return "Not releasable";
    default:
      return "Release state available";
  }
}

function packageStateLabel(
  finalPackage: StoredFinalPackageRecord | null,
  initialPackage: StoredInitialPackageRecord,
): string {
  if (finalPackage !== null) {
    const labels: Record<StoredFinalPackageRecord["packageState"], string> = {
      not_started: "Not started",
      initial_package_in_progress: "Initial package in progress",
      initial_package_ready: "Initial package ready",
      final_package_blocked: "Final package blocked",
      final_package_in_progress: "Final package in progress",
      final_package_ready: "Final package ready",
    };
    return labels[finalPackage.packageState];
  }

  const labels: Record<StoredInitialPackageRecord["status"], string> = {
    conditional_early_draft_possible: "Conditional early draft possible",
    review_recommended: "Review recommended",
    rebuild_recommended: "Rebuild recommended",
    not_applicable_yet: "Not applicable yet",
    not_requested: "Not requested",
  };
  return labels[initialPackage.status];
}

function reviewVisibilityLabel(reviewIssues: StoredReviewIssueRecord[]): string {
  if (reviewIssues.length === 0) return "No linked review items";
  if (reviewIssues.some((issue) => issue.reviewState !== "review_resolved")) {
    return `${reviewIssues.length} linked review item${reviewIssues.length === 1 ? "" : "s"} visible`;
  }
  return `${reviewIssues.length} linked review item${reviewIssues.length === 1 ? "" : "s"} resolved`;
}

function finalSubtitle(
  finalPackage: StoredFinalPackageRecord,
  initialPackage: StoredInitialPackageRecord,
  approval: AdminApprovalStatus,
): string {
  const approvalLabel = approval === "approved" ? "admin-approved" : "awaiting approval";
  return `${initialPackage.outward.workflowValueUsefulnessExplanation} Delivery package is ${approvalLabel}.`;
}

function initialSubtitle(initialPackage: StoredInitialPackageRecord): string {
  return initialPackage.outward.workflowValueUsefulnessExplanation;
}

export function listPackageSurfaceItems(store: InMemoryStore): PackageSurfaceListItem[] {
  const cases = new Map(store.cases.findAll().map((c) => [c.caseId, c]));
  const initialPackages = store.initialPackages.findAll();
  const finalPackages = store.finalPackages.findAll();
  const reviewIssues = store.reviewIssues.findAll();

  const initialById = new Map(
    initialPackages.map((record) => [record.initialPackageId, record]),
  );
  const issuesByInitialPackageId = new Map<string, StoredReviewIssueRecord[]>();
  for (const issue of reviewIssues) {
    const existing = issuesByInitialPackageId.get(issue.initialPackageId) ?? [];
    existing.push(issue);
    issuesByInitialPackageId.set(issue.initialPackageId, existing);
  }

  const linkedInitialPackageIds = new Set<string>();
  const items: PackageSurfaceListItem[] = [];

  for (const finalPackage of finalPackages) {
    const linkedInitial = finalPackage.initialPackageId
      ? initialById.get(finalPackage.initialPackageId) ?? null
      : null;
    if (linkedInitial !== null) linkedInitialPackageIds.add(linkedInitial.initialPackageId);
    const reviewItems = linkedInitial
      ? issuesByInitialPackageId.get(linkedInitial.initialPackageId) ?? []
      : [];
    const caseContext = toCaseContext(
      cases.get(finalPackage.caseId) ?? null,
      finalPackage.caseId,
    );

    items.push({
      id: finalPackage.packageId,
      kind: "final_package",
      title: `${caseContext.useCaseLabel} delivery package`,
      subtitle:
        linkedInitial !== null
          ? finalSubtitle(finalPackage, linkedInitial, finalPackage.adminApprovalStatus)
          : "Final package available for client-facing delivery.",
      caseContext,
      packageStateLabel:
        linkedInitial !== null
          ? packageStateLabel(finalPackage, linkedInitial)
          : finalPackage.packageState.replaceAll("_", " "),
      releaseStateLabel: releaseLabel(
        finalPackage,
        linkedInitial?.status ?? "review_recommended",
      ),
      reviewVisibilityLabel: reviewVisibilityLabel(reviewItems),
      reviewItemCount: reviewItems.length,
      packageUpdatedAt: finalPackage.updatedAt,
      linkedInitialPackageId: linkedInitial?.initialPackageId,
      linkedFinalPackageId: finalPackage.packageId,
      downloadHref: `/packages/${encodeURIComponent(finalPackage.packageId)}/download`,
    });
  }

  for (const initialPackage of initialPackages) {
    if (linkedInitialPackageIds.has(initialPackage.initialPackageId)) continue;
    const reviewItems =
      issuesByInitialPackageId.get(initialPackage.initialPackageId) ?? [];
    const caseContext = toCaseContext(
      cases.get(initialPackage.caseId) ?? null,
      initialPackage.caseId,
    );

    items.push({
      id: initialPackage.initialPackageId,
      kind: "initial_preview",
      title: `${caseContext.useCaseLabel} preview package`,
      subtitle: initialSubtitle(initialPackage),
      caseContext,
      packageStateLabel: packageStateLabel(null, initialPackage),
      releaseStateLabel: releaseLabel(null, initialPackage.status),
      reviewVisibilityLabel: reviewVisibilityLabel(reviewItems),
      reviewItemCount: reviewItems.length,
      packageUpdatedAt: initialPackage.createdAt,
      linkedInitialPackageId: initialPackage.initialPackageId,
      downloadHref: `/packages/${encodeURIComponent(initialPackage.initialPackageId)}/download`,
    });
  }

  return items.sort((a, b) => b.packageUpdatedAt.localeCompare(a.packageUpdatedAt));
}

export function getPackageSurfaceDetail(
  id: string,
  store: InMemoryStore,
): PackageSurfaceDetail | null {
  const finalPackage = store.finalPackages.findById(id);
  if (finalPackage !== null) {
    const initialPackage = finalPackage.initialPackageId
      ? store.initialPackages.findById(finalPackage.initialPackageId)
      : null;
    if (initialPackage === null) return null;

    const caseContext = toCaseContext(
      store.cases.findById(finalPackage.caseId),
      finalPackage.caseId,
    );
    const reviewIssues =
      store.reviewIssues.findByInitialPackageId(initialPackage.initialPackageId);

    return {
      id: finalPackage.packageId,
      kind: "final_package",
      title: `${caseContext.useCaseLabel} delivery package`,
      subtitle: finalSubtitle(
        finalPackage,
        initialPackage,
        finalPackage.adminApprovalStatus,
      ),
      caseContext,
      initialPackage,
      finalPackage,
      reviewIssues,
      downloadHref: `/packages/${encodeURIComponent(finalPackage.packageId)}/download`,
      adminReleaseHref: `/final-packages/${encodeURIComponent(finalPackage.packageId)}`,
    };
  }

  const initialPackage = store.initialPackages.findById(id);
  if (initialPackage === null) return null;
  const caseContext = toCaseContext(
    store.cases.findById(initialPackage.caseId),
    initialPackage.caseId,
  );

  return {
    id: initialPackage.initialPackageId,
    kind: "initial_preview",
    title: `${caseContext.useCaseLabel} preview package`,
    subtitle: initialSubtitle(initialPackage),
    caseContext,
    initialPackage,
    finalPackage: null,
    reviewIssues: store.reviewIssues.findByInitialPackageId(initialPackage.initialPackageId),
    downloadHref: `/packages/${encodeURIComponent(initialPackage.initialPackageId)}/download`,
  };
}
