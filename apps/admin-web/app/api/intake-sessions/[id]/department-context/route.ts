import { NextResponse } from "next/server";
import {
  PRIMARY_DEPARTMENTS,
  assertPreHierarchyReady,
  createStructuredContextFromAvailableMaterial,
  createStructuredContextWithProvider,
  getDepartmentFraming,
  saveDepartmentFraming,
} from "@workflow/sources-context";
import { providerRegistry } from "@workflow/integrations";
import { store } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSessions: store.intakeSessions,
    intakeSources: store.intakeSources,
    departmentFraming: store.departmentFraming,
    structuredContexts: store.structuredContexts,
    textArtifacts: store.textArtifacts,
    providerJobs: store.providerJobs,
  };
}

function payload(sessionId: string) {
  const framing = getDepartmentFraming(sessionId, repos());
  return {
    primaryDepartments: PRIMARY_DEPARTMENTS,
    framing,
    readiness: assertPreHierarchyReady(framing),
    structuredContext: store.structuredContexts.findBySessionId(sessionId),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return NextResponse.json(payload(params.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  try {
    const framing = saveDepartmentFraming({
      sessionId: params.id,
      primaryDepartmentSelection: String(body.primaryDepartmentSelection ?? ""),
      customDepartmentLabel: typeof body.customDepartmentLabel === "string" ? body.customDepartmentLabel : undefined,
      mappingDecision: body.mappingDecision as never,
      acceptedInternalFamily: body.acceptedInternalFamily as never,
      companyContextAvailabilityStatus: body.companyContextAvailabilityStatus as never,
      departmentContextAvailabilityStatus: body.departmentContextAvailabilityStatus as never,
      useCaseBoundaryStatus: body.useCaseBoundaryStatus as never,
      selectedUseCase: typeof body.selectedUseCase === "string" ? body.selectedUseCase : undefined,
      useCaseScopeType: body.useCaseScopeType as never,
    }, repos());
    return NextResponse.json({ ...payload(params.id), framing });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as { action?: string };
  try {
    const framing = getDepartmentFraming(params.id, repos());
    const readiness = assertPreHierarchyReady(framing);
    if (body.action === "check-readiness") {
      return NextResponse.json({ ...payload(params.id), readiness }, { status: readiness.ready ? 200 : 409 });
    }
    if (body.action !== "generate-structured-context" && body.action !== "generate-ai-structured-context") {
      return NextResponse.json({ error: "action must be check-readiness, generate-structured-context, or generate-ai-structured-context" }, { status: 400 });
    }
    if (!readiness.ready) {
      return NextResponse.json({ ...payload(params.id), readiness }, { status: 409 });
    }
    const structuredContext = body.action === "generate-ai-structured-context"
      ? await createStructuredContextWithProvider({
        sessionId: params.id,
        provider: providerRegistry.getExtractionProvider("google"),
      }, repos())
      : createStructuredContextFromAvailableMaterial(params.id, repos());
    return NextResponse.json({ ...payload(params.id), structuredContext }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
