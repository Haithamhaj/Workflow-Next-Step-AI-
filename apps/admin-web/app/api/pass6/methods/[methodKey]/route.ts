import { NextResponse } from "next/server";
import {
  findPass6MethodRegistryItem,
  resolvePass6MethodRegistryForAdmin,
} from "@workflow/synthesis-evaluation";
import type { AnalysisMethodKey } from "@workflow/contracts";
import { store } from "../../../../../lib/store";

interface Pass6MethodDetailRouteProps {
  params: {
    methodKey: AnalysisMethodKey;
  };
}

export async function GET(_request: Request, { params }: Pass6MethodDetailRouteProps) {
  const method = findPass6MethodRegistryItem(params.methodKey, store.pass6ConfigurationProfiles);
  if (!method) {
    return NextResponse.json({ error: "Pass 6 method not found." }, { status: 404 });
  }
  const registry = resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles);
  return NextResponse.json({
    method,
    defaultSelectionRules: registry.defaultSelectionRules.filter((rule) => rule.primaryMethodKey === params.methodKey),
    conditionalMultiLensPolicy: registry.conditionalMultiLensPolicy,
    lockedBoundaries: registry.lockedBoundaries,
    adminForcedMethodRule: registry.adminForcedMethodRule,
  });
}
