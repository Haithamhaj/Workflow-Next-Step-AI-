import { NextResponse } from "next/server";
import {
  findSynthesisInputBundleForReview,
  getSynthesisInputBundleReviewDetail,
} from "@workflow/synthesis-evaluation";
import { store } from "../../../../../lib/store";

interface SynthesisInputBundleDetailRouteProps {
  params: {
    bundleId: string;
  };
}

export async function GET(_request: Request, { params }: SynthesisInputBundleDetailRouteProps) {
  const bundle = findSynthesisInputBundleForReview(params.bundleId, store.synthesisInputBundles);
  if (!bundle) {
    return NextResponse.json({ error: "SynthesisInputBundle not found." }, { status: 404 });
  }
  return NextResponse.json({
    bundle,
    detail: getSynthesisInputBundleReviewDetail(bundle),
  });
}
