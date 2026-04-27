import { NextResponse } from "next/server";
import {
  createDefaultPass6ConfigurationDraft,
  listPass6ConfigurationProfiles,
  resolvePass6MethodRegistryForAdmin,
  savePass6ConfigurationProfile,
  updatePass6MethodActiveStatus,
} from "@workflow/synthesis-evaluation";
import type { AnalysisMethodKey } from "@workflow/contracts";
import { store } from "../../../../lib/store";

interface Pass6MethodsRequestBody {
  action?: string;
  configId?: string;
  methodKey?: AnalysisMethodKey;
  active?: boolean | string;
  changedBy?: string;
  changeReason?: string;
}

function ensureConfigDraft() {
  if (listPass6ConfigurationProfiles(store.pass6ConfigurationProfiles).length > 0) return;
  savePass6ConfigurationProfile(createDefaultPass6ConfigurationDraft({
    configId: "pass6-method-registry-default-draft",
    changedBy: "system",
    changeReason: "Initial Pass 6 method registry config draft.",
  }), store.pass6ConfigurationProfiles);
}

function redirectWithError(request: Request, message: string) {
  const url = new URL("/pass6/methods", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET() {
  ensureConfigDraft();
  return NextResponse.json(resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles));
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  try {
    const body: Pass6MethodsRequestBody = isJson
      ? await request.json() as Pass6MethodsRequestBody
      : Object.fromEntries((await request.formData()).entries()) as Pass6MethodsRequestBody;

    if (body.action !== "toggle-method") {
      return NextResponse.json({ error: "Unsupported Pass 6 method registry action." }, { status: 400 });
    }
    if (!body.configId || !body.methodKey) {
      const message = "configId and methodKey are required.";
      return isJson
        ? NextResponse.json({ error: message, structured: true }, { status: 400 })
        : redirectWithError(request, message);
    }

    const result = updatePass6MethodActiveStatus({
      configId: body.configId,
      methodKey: body.methodKey,
      active: body.active === true || body.active === "true",
      changedBy: body.changedBy || "admin",
      changeReason: body.changeReason || "Update Pass 6 method active status from admin surface.",
    }, store.pass6ConfigurationProfiles);

    if (!result.ok) {
      return isJson
        ? NextResponse.json({ error: result.error, structured: true }, { status: 400 })
        : redirectWithError(request, result.error);
    }

    if (!isJson) {
      return NextResponse.redirect(new URL("/pass6/methods", request.url), { status: 303 });
    }
    return NextResponse.json({
      result,
      registry: resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message, structured: true }, { status: 400 });
  }
}
