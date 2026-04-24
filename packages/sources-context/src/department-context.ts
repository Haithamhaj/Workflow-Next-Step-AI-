import type {
  CompanyContextAvailabilityStatus,
  DepartmentContextAvailabilityStatus,
  DepartmentFramingRecord,
  DepartmentMappingDecision,
  InternalDepartmentFamily,
  Phase6StructuredContext,
  StructuredContextFieldEvidenceRef,
  StructuredContextRecord,
  UseCaseBoundaryStatus,
  UseCaseScopeType,
} from "@workflow/contracts";
import type {
  DepartmentFramingRepository,
  IntakeSessionRepository,
  IntakeSourceRepository,
  ProviderExtractionJobRepository,
  StructuredContextRecordRepository,
  TextArtifactRepository,
} from "@workflow/persistence";

export const PRIMARY_DEPARTMENTS = [
  "Sales",
  "Operations",
  "HR",
  "IT",
  "Finance",
  "Legal",
  "Customer Support",
  "Procurement",
  "Marketing",
  "Other / Custom Department",
] as const;

const INTERNAL_FAMILIES: InternalDepartmentFamily[] = [
  "sales",
  "operations",
  "hr",
  "it",
  "finance",
  "legal",
  "customer_support",
  "procurement",
  "marketing",
  "other_or_unknown",
];

export interface DepartmentContextRepos {
  intakeSessions: IntakeSessionRepository;
  intakeSources: IntakeSourceRepository;
  departmentFraming: DepartmentFramingRepository;
  structuredContexts: StructuredContextRecordRepository;
  textArtifacts: TextArtifactRepository;
  providerJobs: ProviderExtractionJobRepository;
}

function now(): string {
  return new Date().toISOString();
}

function familyFor(label: string): InternalDepartmentFamily {
  const normalized = label.toLowerCase().replace(/[^a-z]+/g, "_");
  if (normalized.includes("sale")) return "sales";
  if (normalized.includes("operation") || normalized.includes("fulfillment")) return "operations";
  if (normalized.includes("human") || normalized === "hr") return "hr";
  if (normalized.includes("it") || normalized.includes("tech")) return "it";
  if (normalized.includes("finance") || normalized.includes("account")) return "finance";
  if (normalized.includes("legal")) return "legal";
  if (normalized.includes("support") || normalized.includes("service")) return "customer_support";
  if (normalized.includes("procurement") || normalized.includes("purchas")) return "procurement";
  if (normalized.includes("marketing")) return "marketing";
  return "other_or_unknown";
}

function cleanLabel(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function evidence(
  fieldKey: string,
  kind: StructuredContextFieldEvidenceRef["kind"],
  partial: Omit<StructuredContextFieldEvidenceRef, "evidenceId" | "kind">,
): StructuredContextFieldEvidenceRef {
  return {
    evidenceId: `evidence_${fieldKey}_${crypto.randomUUID()}`,
    kind,
    ...partial,
  };
}

export function getDepartmentFraming(sessionId: string, repos: DepartmentContextRepos): DepartmentFramingRecord | null {
  return repos.departmentFraming.findBySessionId(sessionId);
}

export function saveDepartmentFraming(input: {
  sessionId: string;
  primaryDepartmentSelection: string;
  customDepartmentLabel?: string;
  mappingDecision?: DepartmentMappingDecision;
  acceptedInternalFamily?: InternalDepartmentFamily;
  companyContextAvailabilityStatus?: CompanyContextAvailabilityStatus;
  departmentContextAvailabilityStatus?: DepartmentContextAvailabilityStatus;
  useCaseBoundaryStatus?: UseCaseBoundaryStatus;
  selectedUseCase?: string;
  useCaseScopeType?: UseCaseScopeType;
}, repos: DepartmentContextRepos): DepartmentFramingRecord {
  const session = repos.intakeSessions.findById(input.sessionId);
  if (!session) throw new Error(`Intake session not found: ${input.sessionId}`);

  const existing = repos.departmentFraming.findBySessionId(input.sessionId);
  const selected = cleanLabel(input.primaryDepartmentSelection) || existing?.primaryDepartmentSelection || "Operations";
  const custom = cleanLabel(input.customDepartmentLabel) || existing?.customDepartmentLabel;
  const activeDepartmentLabel = selected === "Other / Custom Department" ? (custom || "Custom Department") : selected;
  const suggestedInternalFamily = familyFor(activeDepartmentLabel);
  const mappingDecision = input.mappingDecision ?? existing?.mappingDecision ?? "unknown";
  const acceptedInternalFamily = input.acceptedInternalFamily && INTERNAL_FAMILIES.includes(input.acceptedInternalFamily)
    ? input.acceptedInternalFamily
    : mappingDecision === "accepted"
      ? suggestedInternalFamily
      : existing?.acceptedInternalFamily;

  const useCaseBoundaryStatus = input.useCaseBoundaryStatus ?? existing?.useCaseBoundaryStatus ?? "use_case_not_selected";
  const selectedUseCase = useCaseBoundaryStatus === "use_case_same_as_department"
    ? activeDepartmentLabel
    : cleanLabel(input.selectedUseCase) || existing?.selectedUseCase;

  const record: DepartmentFramingRecord = {
    framingId: existing?.framingId ?? `framing_${crypto.randomUUID()}`,
    sessionId: session.sessionId,
    caseId: session.caseId,
    primaryDepartmentSelection: selected,
    customDepartmentLabel: custom,
    activeDepartmentLabel,
    suggestedInternalFamily,
    mappingDecision,
    acceptedInternalFamily: mappingDecision === "rejected" || mappingDecision === "unknown" ? undefined : acceptedInternalFamily,
    mappingRationale: `Suggested from department label "${activeDepartmentLabel}" only; does not overwrite company-facing label.`,
    companyContextAvailabilityStatus: input.companyContextAvailabilityStatus ?? existing?.companyContextAvailabilityStatus ?? "company_context_pending_or_unknown",
    departmentContextAvailabilityStatus: input.departmentContextAvailabilityStatus ?? existing?.departmentContextAvailabilityStatus ?? "department_context_pending_or_unknown",
    useCaseBoundaryStatus,
    selectedUseCase,
    useCaseScopeType: input.useCaseScopeType ?? existing?.useCaseScopeType ?? (useCaseBoundaryStatus === "use_case_same_as_department" ? "department" : "unknown"),
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  repos.departmentFraming.save(record);
  repos.intakeSessions.save({
    ...session,
    primaryDepartment: activeDepartmentLabel,
    useCaseSelection: selectedUseCase ? { useCaseLabel: selectedUseCase, selectedAt: now() } : session.useCaseSelection,
    updatedAt: now(),
  });
  return record;
}

export function assertPreHierarchyReady(framing: DepartmentFramingRecord | null): { ready: boolean; reason?: string } {
  if (!framing) return { ready: false, reason: "Department and use case framing has not been saved." };
  if (framing.useCaseBoundaryStatus !== "use_case_same_as_department" && framing.useCaseBoundaryStatus !== "use_case_selected_custom") {
    return { ready: false, reason: "Use case must be selected before final pre-hierarchy review." };
  }
  if (!framing.selectedUseCase?.trim()) {
    return { ready: false, reason: "Selected use case label is missing." };
  }
  return { ready: true };
}

export function createStructuredContextFromAvailableMaterial(sessionId: string, repos: DepartmentContextRepos): StructuredContextRecord {
  const session = repos.intakeSessions.findById(sessionId);
  if (!session) throw new Error(`Intake session not found: ${sessionId}`);
  const framing = repos.departmentFraming.findBySessionId(sessionId);
  const ready = assertPreHierarchyReady(framing);
  if (!ready.ready || !framing) throw new Error(ready.reason ?? "Use case is not ready.");

  const sources = repos.intakeSources.findBySessionId(sessionId);
  const artifacts = repos.textArtifacts.findAll();
  const providerJobs = repos.providerJobs.findBySessionId(sessionId);
  const companySources = sources.filter((source) => source.bucket === "company");
  const departmentSources = sources.filter((source) => source.bucket === "department");

  const fieldEvidence: Phase6StructuredContext["fieldEvidence"] = {};
  const addEvidence = (fieldKey: string, item: StructuredContextFieldEvidenceRef) => {
    fieldEvidence[fieldKey] = [...(fieldEvidence[fieldKey] ?? []), item];
  };

  for (const source of sources) {
    const snippet = source.extractedText ?? source.noteText ?? source.websiteUrl ?? source.displayName ?? source.fileName ?? source.sourceId;
    const kind = source.inputType === "manual_note"
      ? "operator_original_note"
      : source.inputType === "website_url"
        ? "extracted_from_website"
        : "extracted_from_uploaded_source";
    addEvidence(source.bucket === "company" ? "companyContextSummary" : "departmentContextSummary", evidence(source.bucket, kind, {
      sourceId: source.sourceId,
      operatorNoteId: source.inputType === "manual_note" ? source.sourceId : undefined,
      snippet: snippet.slice(0, 240),
    }));
  }

  for (const artifact of artifacts.filter((item) => item.sourceId && sources.some((source) => source.sourceId === item.sourceId))) {
    addEvidence("keyContextSignalsAndRisks", evidence("artifact", "extracted_from_uploaded_source", {
      sourceId: artifact.sourceId,
      providerJobId: artifact.jobId,
      snippet: artifact.text.slice(0, 240),
    }));
  }

  addEvidence("mainDepartment", evidence("mainDepartment", "admin_confirmed", { note: framing.activeDepartmentLabel }));
  addEvidence("selectedUseCase", evidence("selectedUseCase", "admin_confirmed", { note: framing.selectedUseCase }));

  const companyText = companySources.map((source) => source.extractedText ?? source.noteText ?? source.websiteUrl ?? source.displayName ?? "").filter(Boolean).join("\n");
  const departmentText = departmentSources.map((source) => source.extractedText ?? source.noteText ?? source.displayName ?? "").filter(Boolean).join("\n");
  const providerSignal = providerJobs.find((job) => job.status === "succeeded")?.provider;

  const context: Phase6StructuredContext = {
    companyName: session.caseId,
    companyScopeSummary: companyText ? companyText.slice(0, 300) : "Company context is optional and not fully available.",
    companyContextSummary: companyText || "No company context text was provided; status records whether this was skipped or pending.",
    companyContextAvailabilityStatus: framing.companyContextAvailabilityStatus,
    departmentContextAvailabilityStatus: framing.departmentContextAvailabilityStatus,
    domain: session.structuredContext?.domain ?? "unknown",
    subtypeOrOperatingModel: "not_generated_by_ai",
    visibleServicesOrProducts: companySources.flatMap((source) => source.websiteUrl ? [source.websiteUrl] : []),
    visibleCompanyLevelSignals: companySources.map((source) => source.displayName ?? source.sourceId),
    mainDepartment: framing.activeDepartmentLabel,
    selectedUseCase: framing.selectedUseCase ?? "",
    useCaseBoundaryStatus: framing.useCaseBoundaryStatus,
    useCaseScopeType: framing.useCaseScopeType,
    departmentContextSummary: departmentText || "No department documents are available in current intake; hierarchy intake remains the later path for structure.",
    visibleRoleFamiliesOrOrgSignals: departmentSources.map((source) => source.displayName ?? source.sourceId),
    departmentSpecificSignalsAndRisks: [
      framing.departmentContextAvailabilityStatus,
      framing.mappingDecision === "unknown" ? "internal_department_family_unknown" : `internal_department_family_${framing.acceptedInternalFamily ?? framing.suggestedInternalFamily}`,
    ],
    keyContextSignalsAndRisks: [
      `provider_signal_${providerSignal ?? "none"}`,
      "Transcript confidence and AI/source-role suggestions remain review-sensitive.",
    ],
    confidenceAndUnknowns: "Admin-created Phase 6 structured context from reviewed/available intake material; no deep workflow analysis or hierarchy generation was run.",
    fieldEvidence,
  };

  const existing = repos.structuredContexts.findBySessionId(sessionId);
  const record: StructuredContextRecord = {
    structuredContextId: existing?.structuredContextId ?? `structured_context_${crypto.randomUUID()}`,
    sessionId,
    caseId: session.caseId,
    version: (existing?.version ?? 0) + 1,
    status: "draft",
    fieldCount: Object.keys(context).length,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
    notes: "Phase 6 admin-created structured context; hierarchy not implemented.",
    context,
  };
  repos.structuredContexts.save(record);
  return record;
}
