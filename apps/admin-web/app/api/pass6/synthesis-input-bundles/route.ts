import { NextResponse } from "next/server";
import {
  createSynthesisInputBundleForAdminReview,
  getSynthesisInputBundleReviewDetail,
  listSynthesisInputBundlesForReview,
  summarizeSynthesisInputBundleForReview,
} from "@workflow/synthesis-evaluation";
import { store } from "../../../../lib/store";

interface SynthesisInputBundleRequestBody {
  action?: string;
  caseId?: string;
  bundleId?: string;
}

function redirectWithError(request: Request, message: string) {
  const url = new URL("/pass6/synthesis-input-bundles", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET() {
  const bundles = listSynthesisInputBundlesForReview(store.synthesisInputBundles);
  return NextResponse.json({
    bundles,
    summaries: bundles.map(summarizeSynthesisInputBundleForReview),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  try {
    const body: SynthesisInputBundleRequestBody = isJson
      ? await request.json() as SynthesisInputBundleRequestBody
      : Object.fromEntries((await request.formData()).entries()) as SynthesisInputBundleRequestBody;

    if (body.action !== "build-from-case") {
      return NextResponse.json({ error: "Unsupported Pass 6 SynthesisInputBundle action." }, { status: 400 });
    }
    if (!body.caseId) {
      return isJson
        ? NextResponse.json({ error: "caseId is required.", structured: true }, { status: 400 })
        : redirectWithError(request, "caseId is required.");
    }

    const result = createSynthesisInputBundleForAdminReview({
      caseId: body.caseId,
      bundleId: body.bundleId || `sib:${body.caseId}:${Date.now()}`,
    }, {
      participantSessions: store.participantSessions,
      firstPassExtractionOutputs: store.firstPassExtractionOutputs,
      clarificationCandidates: store.clarificationCandidates,
      boundarySignals: store.boundarySignals,
      evidenceDisputes: store.evidenceDisputes,
      pass6HandoffCandidates: store.pass6HandoffCandidates,
      targetingRolloutPlans: store.targetingRolloutPlans,
      synthesisInputBundles: store.synthesisInputBundles,
    });

    if (!result.ok) {
      return isJson
        ? NextResponse.json({ error: result.error, structured: true }, { status: 400 })
        : redirectWithError(request, result.error);
    }

    const detail = getSynthesisInputBundleReviewDetail(result.bundle);
    if (!isJson) {
      return NextResponse.redirect(new URL(`/pass6/synthesis-input-bundles/${result.bundle.bundleId}`, request.url), { status: 303 });
    }
    return NextResponse.json({
      bundle: result.bundle,
      detail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message, structured: true }, { status: 400 });
  }
}
