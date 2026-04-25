import { ensureActivePass4TargetingPromptSpec, listPass4PromptSpecs, compilePass4TargetingPromptSpec } from "@workflow/prompts";
import { store } from "../../../lib/store";

export default function Pass4PromptWorkspacePage() {
  const active = ensureActivePass4TargetingPromptSpec(store.structuredPromptSpecs);
  const specs = listPass4PromptSpecs(store.structuredPromptSpecs);
  const draft = specs.find((spec) => spec.status === "draft");
  const previous = specs.filter((spec) => spec.status === "previous");
  const compiled = compilePass4TargetingPromptSpec(draft ?? active, {
    caseId: "current_case",
    sessionId: "current_session",
    selectedDepartment: "Current department",
    selectedUseCase: "Current use case",
    approvedHierarchySnapshotJson: "{ approved Pass 3 hierarchy snapshot }",
    hierarchyReadinessSnapshotJson: "{ Pass 3 readiness snapshot }",
    sourceSignalsJson: "[ source signals ]",
  });
  return (
    <>
      <h2>Pass 4 Prompt Workspace / PromptSpec Surface</h2>
      <div className="card">
        <p><strong>Registry entry:</strong> {active.linkedModule}</p>
        <p><strong>Active:</strong> {active.promptSpecId} v{active.version}</p>
        <p><strong>Draft:</strong> {draft ? `${draft.promptSpecId} v${draft.version}` : "none"}</p>
        <p><strong>Previous active versions:</strong> {previous.map((item) => item.promptSpecId).join(", ") || "none"}</p>
        <p><strong>Provider execution failure state:</strong> surfaced on each Targeting Recommendation Packet generation.</p>
        <form action="/api/targeting-rollout/prompts" method="post">
          <input type="hidden" name="action" value="draft" />
          <button type="submit">Create draft from active</button>
        </form>
      </div>
      <h3>Structured PromptSpec Fields</h3>
      {active.blocks.map((block) => (
        <div key={block.blockId} className="card" style={{ marginBottom: "8px" }}>
          <h4>{block.label}</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{block.body}</p>
        </div>
      ))}
      <h3>Full Compiled Prompt Preview</h3>
      <pre style={{ whiteSpace: "pre-wrap", maxHeight: "520px", overflow: "auto" }}>{compiled}</pre>
      <h3>Active vs Draft Output Comparison</h3>
      <p style={{ color: "#aaa" }}>Use the prompt API to create a draft, run current case tests, compare active/draft outputs, then promote explicitly. Promotion/rejection notes are accepted by the API and stored with PromptSpec state changes.</p>
      <h3>Draft / Active / Previous / Rollback Controls</h3>
      <p style={{ color: "#aaa" }}>Active, draft, previous, and rollback references use the same PromptSpec lifecycle as Pass 3.</p>
    </>
  );
}
