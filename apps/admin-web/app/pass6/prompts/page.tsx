import {
  PASS6_PROMPT_CAPABILITY_KEYS,
  comparePass6PromptDraftToActive,
  createDefaultPass6PromptSpecs,
  listPass6PromptSpecs,
} from "@workflow/prompts";
import { store } from "../../../lib/store";

export default function Pass6PromptWorkspacePage() {
  createDefaultPass6PromptSpecs(store.pass6PromptSpecs);
  const specs = listPass6PromptSpecs(store.pass6PromptSpecs);
  const comparisons = PASS6_PROMPT_CAPABILITY_KEYS.map((capabilityKey) =>
    comparePass6PromptDraftToActive(capabilityKey, store.pass6PromptSpecs)
  );

  return (
    <>
      <h2>Pass 6 Prompt Workspace</h2>
      <p className="muted">Structured PromptSpecs for later Pass 6 provider tests. This workspace previews, compares, and versions prompts only.</p>

      <div className="card">
        <h3>Workspace Controls</h3>
        <form action="/api/pass6/prompts" method="post">
          <input type="hidden" name="action" value="default-drafts" />
          <button type="submit">Create Missing Default Drafts</button>
        </form>
      </div>

      <div className="card">
        <h3>PromptSpecs</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Capability</th>
              <th>PromptSpec</th>
              <th>Status</th>
              <th>Version</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((spec) => (
              <tr key={spec.promptSpecId}>
                <td>{spec.capabilityKey}</td>
                <td><a href={`/pass6/prompts/${spec.promptSpecId}`}>{spec.name}</a></td>
                <td>{spec.status}</td>
                <td>{spec.version}</td>
                <td>{spec.updatedAt}</td>
                <td>
                  {spec.status === "draft" ? (
                    <form action="/api/pass6/prompts" method="post">
                      <input type="hidden" name="action" value="promote" />
                      <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
                      <button type="submit">Promote</button>
                    </form>
                  ) : null}
                  {spec.status === "active" || spec.status === "previous" ? (
                    <form action="/api/pass6/prompts" method="post">
                      <input type="hidden" name="action" value="clone-to-draft" />
                      <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
                      <button type="submit">Clone Draft</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Draft vs Active</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Capability</th>
              <th>Active</th>
              <th>Draft</th>
              <th>Changed sections</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comparison) => (
              <tr key={comparison.capabilityKey}>
                <td>{comparison.capabilityKey}</td>
                <td>{comparison.activePromptSpecId ?? "none"}</td>
                <td>{comparison.draftPromptSpecId ?? "none"}</td>
                <td>{comparison.changedSections.join(", ") || "none"}</td>
                <td>{comparison.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Locked Prompt Boundaries</h3>
        <ul>
          <li>Prompt cannot make document claims operational truth by default.</li>
          <li>Prompt cannot approve Initial Package by score alone.</li>
          <li>Prompt cannot bypass admin review for material conflicts.</li>
          <li>Prompt cannot make Copilot write state autonomously.</li>
          <li>Prompt cannot make visual renderer own workflow truth.</li>
          <li>Prompt cannot start Pass 7 mechanics.</li>
        </ul>
      </div>
    </>
  );
}
