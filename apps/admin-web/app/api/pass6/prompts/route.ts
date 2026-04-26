import { NextResponse } from "next/server";
import {
  archivePass6PromptSpec,
  clonePass6PromptSpecToDraft,
  comparePass6PromptDraftToActive,
  createDefaultPass6PromptSpecs,
  createPass6PromptTestCase,
  listPass6PromptSpecs,
  promotePass6PromptDraft,
  updatePass6PromptDraftSections,
  type Pass6PromptCapabilityKey,
  type Pass6PromptStructuredSections,
} from "@workflow/prompts";
import { store } from "../../../../lib/store";

interface Pass6PromptRequestBody {
  action?: string;
  promptSpecId?: string;
  capabilityKey?: Pass6PromptCapabilityKey;
  sections?: Pass6PromptStructuredSections;
  sectionsJson?: string;
  newPromptSpecId?: string;
  reason?: string;
  testCaseId?: string;
  testCaseName?: string;
  inputFixture?: Record<string, unknown>;
  inputFixtureJson?: string;
  expectedOutputNotes?: string;
  testCaseStatus?: "draft" | "enabled" | "disabled" | "archived";
}

function redirectWithError(request: Request, promptSpecId: string | undefined, message: string) {
  const path = promptSpecId ? `/pass6/prompts/${promptSpecId}` : "/pass6/prompts";
  const url = new URL(path, request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET() {
  createDefaultPass6PromptSpecs(store.pass6PromptSpecs);
  const specs = listPass6PromptSpecs(store.pass6PromptSpecs);
  return NextResponse.json({
    specs,
    comparisons: specs.map((spec) => comparePass6PromptDraftToActive(spec.capabilityKey, store.pass6PromptSpecs)),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  try {
    const body: Pass6PromptRequestBody = isJson
      ? await request.json() as Pass6PromptRequestBody
      : Object.fromEntries((await request.formData()).entries()) as Pass6PromptRequestBody;

    let result: unknown;
    if (body.action === "default-drafts") {
      result = createDefaultPass6PromptSpecs(store.pass6PromptSpecs);
    } else if (body.action === "update-sections" && body.promptSpecId) {
      let sections = body.sections;
      if (!isJson) {
        try {
          sections = JSON.parse(String(body.sectionsJson ?? "")) as Pass6PromptStructuredSections;
        } catch (error) {
          const message = `Invalid prompt section JSON: ${error instanceof Error ? error.message : String(error)}`;
          return redirectWithError(request, body.promptSpecId, message);
        }
      }
      if (!sections) {
        return isJson
          ? NextResponse.json({ error: "Missing PromptSpec sections payload.", structured: true }, { status: 400 })
          : redirectWithError(request, body.promptSpecId, "Missing PromptSpec sections payload.");
      }
      result = updatePass6PromptDraftSections(body.promptSpecId, sections, store.pass6PromptSpecs);
    } else if (body.action === "promote" && body.promptSpecId) {
      result = promotePass6PromptDraft(body.promptSpecId, store.pass6PromptSpecs);
    } else if (body.action === "archive" && body.promptSpecId) {
      result = archivePass6PromptSpec(body.promptSpecId, store.pass6PromptSpecs, { reason: body.reason });
    } else if (body.action === "clone-to-draft" && body.promptSpecId) {
      result = clonePass6PromptSpecToDraft(body.promptSpecId, store.pass6PromptSpecs, { newPromptSpecId: body.newPromptSpecId });
    } else if (body.action === "create-test-case" && body.promptSpecId) {
      let inputFixture = body.inputFixture;
      if (!isJson) {
        try {
          inputFixture = JSON.parse(String(body.inputFixtureJson || "{}")) as Record<string, unknown>;
        } catch (error) {
          const message = `Invalid test case fixture JSON: ${error instanceof Error ? error.message : String(error)}`;
          return redirectWithError(request, body.promptSpecId, message);
        }
      }
      result = createPass6PromptTestCase({
        testCaseId: body.testCaseId || `pass6-prompt-test-${Date.now()}`,
        promptSpecId: body.promptSpecId,
        name: body.testCaseName || "Admin-created Prompt Workspace test case",
        inputFixture: inputFixture as never,
        expectedOutputNotes: body.expectedOutputNotes || "Expected criteria to be reviewed by admin.",
        status: body.testCaseStatus || "enabled",
        enabled: (body.testCaseStatus || "enabled") === "enabled",
      }, {
        promptSpecs: store.pass6PromptSpecs,
        testCases: store.pass6PromptTestCases,
      });
    } else {
      return NextResponse.json({ error: "Unsupported Pass 6 prompt action." }, { status: 400 });
    }

    if (typeof result === "object" && result && "ok" in result && result.ok === false) {
      const error = "error" in result ? String(result.error) : "Pass 6 prompt action failed.";
      return isJson
        ? NextResponse.json({ error, structured: true }, { status: 400 })
        : redirectWithError(request, body.promptSpecId, error);
    }

    if (!isJson) {
      const id = body.promptSpecId && body.action !== "default-drafts" ? body.promptSpecId : undefined;
      return NextResponse.redirect(new URL(id ? `/pass6/prompts/${id}` : "/pass6/prompts", request.url), { status: 303 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message, structured: true }, { status: 400 });
  }
}
