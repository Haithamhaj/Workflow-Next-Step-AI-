import { NextResponse } from "next/server";
import {
  archivePass6ConfigurationProfile,
  compareActiveVsDraftPass6Configuration,
  createDefaultPass6ConfigurationDraft,
  findActivePass6ConfigurationProfile,
  listPass6ConfigurationProfiles,
  promotePass6ConfigurationDraft,
  rollbackPass6ConfigurationProfile,
  savePass6ConfigurationProfile,
  updatePass6ConfigurationDraft,
} from "@workflow/synthesis-evaluation";
import type { Pass6PolicySet } from "@workflow/contracts";
import { store } from "../../../../lib/store";

interface Pass6ConfigurationRequestBody {
  action?: string;
  configId?: string;
  changedBy?: string;
  changeReason?: string;
  policies?: Pass6PolicySet;
  lockedGovernanceRules?: unknown;
  newConfigId?: string;
}

export async function GET() {
  const profiles = listPass6ConfigurationProfiles(store.pass6ConfigurationProfiles);
  return NextResponse.json({
    profiles,
    active: findActivePass6ConfigurationProfile(store.pass6ConfigurationProfiles),
    drafts: store.pass6ConfigurationProfiles.findDrafts(),
    comparison: compareActiveVsDraftPass6Configuration(store.pass6ConfigurationProfiles),
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body: Pass6ConfigurationRequestBody = contentType.includes("application/json")
      ? await request.json() as Pass6ConfigurationRequestBody
      : Object.fromEntries((await request.formData()).entries()) as Pass6ConfigurationRequestBody;

    const changedBy = body.changedBy || "admin";
    const changeReason = body.changeReason || "Pass 6 configuration admin action.";
    let result: unknown;

    if (body.action === "default-draft") {
      const draft = createDefaultPass6ConfigurationDraft({
        configId: body.configId || `pass6-config-draft-${Date.now()}`,
        changedBy,
        changeReason,
      });
      result = savePass6ConfigurationProfile(draft, store.pass6ConfigurationProfiles);
    } else if (body.action === "update-draft" && body.configId) {
      result = updatePass6ConfigurationDraft(body.configId, {
        policies: body.policies,
        lockedGovernanceRules: body.lockedGovernanceRules as never,
        changedBy,
        changeReason,
      }, store.pass6ConfigurationProfiles);
    } else if (body.action === "promote" && body.configId) {
      result = promotePass6ConfigurationDraft(body.configId, { changedBy, changeReason }, store.pass6ConfigurationProfiles);
    } else if (body.action === "archive" && body.configId) {
      result = archivePass6ConfigurationProfile(body.configId, { changedBy, changeReason }, store.pass6ConfigurationProfiles);
    } else if (body.action === "rollback" && body.configId) {
      result = rollbackPass6ConfigurationProfile(body.configId, {
        newConfigId: body.newConfigId || `pass6-config-rollback-${Date.now()}`,
        changedBy,
        changeReason,
      }, store.pass6ConfigurationProfiles);
    } else {
      return NextResponse.json({ error: "Unsupported Pass 6 configuration action." }, { status: 400 });
    }

    if (typeof result === "object" && result && "ok" in result && result.ok === false) {
      const error = "error" in result ? String(result.error) : "Pass 6 configuration action failed.";
      return NextResponse.json({ error }, { status: 400 });
    }

    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL("/pass6/configuration", request.url), { status: 303 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
