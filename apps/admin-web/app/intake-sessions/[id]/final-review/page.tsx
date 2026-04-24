import Link from "next/link";
import { evaluateFinalPreHierarchyReadiness, getFinalPreHierarchyReview } from "@workflow/sources-context";
import { store } from "../../../../lib/store";
import FinalPreHierarchyReviewClient from "./FinalPreHierarchyReviewClient";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSessions: store.intakeSessions,
    intakeSources: store.intakeSources,
    departmentFraming: store.departmentFraming,
    structuredContexts: store.structuredContexts,
    finalPreHierarchyReviews: store.finalPreHierarchyReviews,
    websiteCrawlPlans: store.websiteCrawlPlans,
    audioTranscriptReviews: store.audioTranscriptReviews,
    providerJobs: store.providerJobs,
    contentChunks: store.contentChunks,
  };
}

export default function FinalPreHierarchyReviewPage({ params }: { params: { id: string } }) {
  const readiness = evaluateFinalPreHierarchyReadiness(params.id, repos());
  const review = getFinalPreHierarchyReview(params.id, repos());
  const framing = store.departmentFraming.findBySessionId(params.id);
  const structuredContext = store.structuredContexts.findBySessionId(params.id);
  const sources = store.intakeSources.findBySessionId(params.id);

  return (
    <>
      <h2>Final Pre-Hierarchy Review</h2>
      <p><Link href={`/intake-sessions/${params.id}`}>Back to intake session</Link></p>
      <p className="muted">
        Pass 2 ends here when confirmed. Hierarchy intake begins in the next separate build slice and is not implemented in Pass 2.
      </p>
      <FinalPreHierarchyReviewClient
        sessionId={params.id}
        initial={{ readiness, review, framing, structuredContext, sources }}
      />
    </>
  );
}
