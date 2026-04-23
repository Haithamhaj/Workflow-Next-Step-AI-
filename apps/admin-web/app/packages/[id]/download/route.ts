import { getPackageSurfaceDetail } from "../../../../lib/package-surface";
import { store } from "../../../../lib/store";

function makeDownloadBody(id: string) {
  const detail = getPackageSurfaceDetail(id, store);
  if (detail === null) return null;

  const lines = [
    `${detail.title}`,
    `${detail.caseContext.domain} / ${detail.caseContext.mainDepartment}`,
    `Case ID: ${detail.caseContext.caseId}`,
    "",
    "Overview",
    detail.subtitle,
    "",
    "Current workflow",
    detail.finalPackage?.finalWorkflowReality
      ?? detail.initialPackage.outward.initialSynthesizedWorkflow,
    "",
  ];

  if (detail.finalPackage?.improvedOrTargetStateWorkflow) {
    lines.push(
      "Target workflow",
      detail.finalPackage.improvedOrTargetStateWorkflow,
      "",
    );
  }

  lines.push(
    "Recommendations",
    detail.finalPackage?.improvementTargetsOrFinalRecommendations
      ?? detail.initialPackage.outward.initialRecommendations,
    "",
    "Gap analysis",
    detail.finalPackage?.finalGapAnalysis
      ?? detail.initialPackage.outward.initialGapAnalysis,
    "",
    "Status visibility",
    `Release: ${detail.finalPackage?.packageReleaseState ?? "preview_only"}`,
    `Review items: ${detail.reviewIssues.length}`,
  );

  if (detail.finalPackage) {
    lines.push(`Admin approval: ${detail.finalPackage.adminApprovalStatus}`);
  }

  return {
    filename: `${detail.id}.txt`,
    body: `${lines.join("\n")}\n`,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const download = makeDownloadBody(params.id);
  if (download === null) {
    return new Response("Package surface not found.", { status: 404 });
  }

  return new Response(download.body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${download.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

