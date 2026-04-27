import {
  createDefaultPass6ConfigurationDraft,
  listPass6ConfigurationProfiles,
  resolvePass6MethodRegistryForAdmin,
  savePass6ConfigurationProfile,
} from "@workflow/synthesis-evaluation";
import { store } from "../../../lib/store";

interface Pass6MethodsPageProps {
  searchParams?: {
    error?: string;
  };
}

export default function Pass6MethodsPage({ searchParams }: Pass6MethodsPageProps) {
  if (listPass6ConfigurationProfiles(store.pass6ConfigurationProfiles).length === 0) {
    savePass6ConfigurationProfile(createDefaultPass6ConfigurationDraft({
      configId: "pass6-method-registry-default-draft",
      changedBy: "system",
      changeReason: "Initial Pass 6 method registry config draft.",
    }), store.pass6ConfigurationProfiles);
  }

  const registry = resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles);
  const draft = store.pass6ConfigurationProfiles.findDrafts()[0] ?? null;

  return (
    <>
      <h2>Pass 6 Method Registry</h2>
      <p className="muted">Admin-visible registry and selection policy for later 6B analysis. Methods are not applied to claims in this block.</p>

      {searchParams?.error ? (
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Method Registry Error</h3>
          <p>{searchParams.error}</p>
        </div>
      ) : null}

      <div className="card">
        <h3>Configuration Basis</h3>
        <p><strong>Resolved config profile:</strong> {registry.configProfileId ?? "default registry without config"}</p>
        <p><strong>Draft available for toggles:</strong> {draft?.configId ?? "none"}</p>
        <p className="muted">Active/inactive method status is configurable through the Pass 6 configuration profile. Locked boundaries are visible and not editable as behavior rules.</p>
      </div>

      <div className="card">
        <h3>Method Cards</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          {registry.methods.map((method) => (
            <div key={method.methodKey} className="card" style={{ margin: 0 }}>
              <h4><a href={`/pass6/methods/${method.methodKey}`}>{method.displayName}</a></h4>
              <p><strong>Status:</strong> {method.active ? "active" : "inactive"}</p>
              <p><strong>Version:</strong> {method.methodVersion}</p>
              <p><strong>Type:</strong> {method.methodType}</p>
              <p>{method.shortDefinition}</p>
              <p><strong>Can affect:</strong> {method.scoringOrClassificationImpact.join("; ")}</p>
              {draft ? (
                <form action="/api/pass6/methods" method="post">
                  <input type="hidden" name="action" value="toggle-method" />
                  <input type="hidden" name="configId" value={draft.configId} />
                  <input type="hidden" name="methodKey" value={method.methodKey} />
                  <input type="hidden" name="active" value={method.active ? "false" : "true"} />
                  <input type="hidden" name="changedBy" value="admin" />
                  <input type="hidden" name="changeReason" value={`Toggle ${method.displayName} from Pass 6 method registry.`} />
                  <button type="submit">{method.active ? "Deactivate" : "Activate"}</button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Default Selection Rules</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Problem type</th>
              <th>Primary method</th>
              <th>Signals</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {registry.defaultSelectionRules.map((rule) => (
              <tr key={rule.ruleId}>
                <td>{rule.problemType}</td>
                <td>{rule.primaryMethodKey}</td>
                <td>{rule.problemSignals.join(", ")}</td>
                <td>{rule.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Conditional Multi-Lens Policy</h3>
        <ol>
          {registry.conditionalMultiLensPolicy.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <p><strong>Triggers:</strong> {registry.conditionalMultiLensPolicy.additionalLensTriggers.join(", ")}</p>
        <p><strong>Complementary findings:</strong> {registry.conditionalMultiLensPolicy.complementaryFindingHandling}</p>
        <p><strong>Supporting findings:</strong> {registry.conditionalMultiLensPolicy.supportingFindingHandling}</p>
        <p><strong>Conflicting findings:</strong> {registry.conditionalMultiLensPolicy.conflictingFindingHandling}</p>
      </div>

      <div className="card">
        <h3>Admin-Forced Method Rule</h3>
        <p>{registry.adminForcedMethodRule}</p>
        <p className="muted">This is documentation/scaffold only. It does not execute methods in Block 8.</p>
      </div>

      <div className="card">
        <h3>Locked Method Boundaries</h3>
        <ul>
          {registry.lockedBoundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}
        </ul>
      </div>
    </>
  );
}
