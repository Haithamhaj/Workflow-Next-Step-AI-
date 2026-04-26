import {
  compareActiveVsDraftPass6Configuration,
  createDefaultPass6ConfigurationDraft,
  findActivePass6ConfigurationProfile,
  listPass6ConfigurationProfiles,
  savePass6ConfigurationProfile,
} from "@workflow/synthesis-evaluation";
import { store } from "../../../lib/store";

export default function Pass6ConfigurationPage() {
  if (listPass6ConfigurationProfiles(store.pass6ConfigurationProfiles).length === 0) {
    savePass6ConfigurationProfile(createDefaultPass6ConfigurationDraft({
      configId: "pass6-config-default-draft",
      changedBy: "system",
      changeReason: "Initial default Pass 6 configuration draft.",
    }), store.pass6ConfigurationProfiles);
  }

  const profiles = listPass6ConfigurationProfiles(store.pass6ConfigurationProfiles);
  const active = findActivePass6ConfigurationProfile(store.pass6ConfigurationProfiles);
  const draft = store.pass6ConfigurationProfiles.findDrafts()[0] ?? null;
  const selected = draft ?? active ?? profiles[0] ?? null;
  const comparison = compareActiveVsDraftPass6Configuration(store.pass6ConfigurationProfiles);

  return (
    <>
      <h2>Pass 6 Configuration</h2>
      <p className="muted">Versioned policy profiles for later Pass 6 blocks. Locked governance rules are visible and not editable.</p>

      <div className="card">
        <h3>Profiles</h3>
        <form action="/api/pass6/configuration" method="post" style={{ marginBottom: "12px" }}>
          <input type="hidden" name="action" value="default-draft" />
          <input type="hidden" name="changedBy" value="admin" />
          <input type="hidden" name="changeReason" value="Create default draft from admin surface." />
          <button type="submit">Create Default Draft</button>
        </form>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>Config</th><th>Status</th><th>Scope</th><th>Version</th><th>Changed</th><th>Actions</th></tr></thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.configId}>
                <td><a href={`/pass6/configuration?configId=${profile.configId}`}>{profile.configId}</a></td>
                <td>{profile.status}</td>
                <td>{profile.scope}{profile.scopeRef ? `:${profile.scopeRef}` : ""}</td>
                <td>{profile.version}</td>
                <td>{profile.changedAt}</td>
                <td>
                  {profile.status === "draft" ? (
                    <form action="/api/pass6/configuration" method="post">
                      <input type="hidden" name="action" value="promote" />
                      <input type="hidden" name="configId" value={profile.configId} />
                      <input type="hidden" name="changedBy" value="admin" />
                      <input type="hidden" name="changeReason" value="Promote draft from admin surface." />
                      <button type="submit">Promote</button>
                    </form>
                  ) : null}
                  {profile.status !== "active" && profile.status !== "archived" ? (
                    <form action="/api/pass6/configuration" method="post">
                      <input type="hidden" name="action" value="archive" />
                      <input type="hidden" name="configId" value={profile.configId} />
                      <input type="hidden" name="changedBy" value="admin" />
                      <input type="hidden" name="changeReason" value="Archive from admin surface." />
                      <button type="submit">Archive</button>
                    </form>
                  ) : null}
                  {profile.status === "previous" ? (
                    <form action="/api/pass6/configuration" method="post">
                      <input type="hidden" name="action" value="rollback" />
                      <input type="hidden" name="configId" value={profile.configId} />
                      <input type="hidden" name="changedBy" value="admin" />
                      <input type="hidden" name="changeReason" value="Create rollback draft from previous config." />
                      <button type="submit">Rollback Draft</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Active vs Draft</h3>
        <p><strong>Active:</strong> {comparison.activeConfigId ?? "none"}</p>
        <p><strong>Draft:</strong> {comparison.draftConfigId ?? "none"}</p>
        <p>{comparison.summary}</p>
        <p><strong>Changed sections:</strong> {comparison.changedSections.join(", ") || "none"}</p>
      </div>

      {selected ? (
        <>
          <div className="card">
            <h3>Selected Profile</h3>
            <p><strong>ID:</strong> {selected.configId}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            <p><strong>Reason:</strong> {selected.changeReason}</p>
            <p><strong>Rollback reference:</strong> {selected.rollbackReference ?? "none"}</p>
          </div>

          <div className="card">
            <h3>Editable Policy Sections</h3>
            <h4>Claim Confidence Weights</h4>
            <ul>{selected.policies.claimScoringPolicy.weights.map((weight) => <li key={weight.factorKey}>{weight.label}: {weight.weight}</li>)}</ul>
            <h4>Materiality Weights</h4>
            <ul>{selected.policies.materialityPolicy.weights.map((weight) => <li key={weight.factorKey}>{weight.label}: {weight.weight}</li>)}</ul>
            <h4>Difference Severity Thresholds</h4>
            <ul>{selected.policies.differenceSeverityPolicy.thresholds.map((threshold) => <li key={threshold.thresholdKey}>{threshold.label}: {threshold.value}</li>)}</ul>
            <h4>Seven Conditions</h4>
            <ul>{selected.policies.sevenConditionPolicy.conditions.map((condition) => <li key={condition.conditionKey}>{condition.label}: warning {condition.warningThreshold}, blocker {condition.blockerThreshold}</li>)}</ul>
            <h4>Method Registry</h4>
            <ul>{selected.policies.methodRegistryConfig.methods.map((method) => <li key={method.methodKey}>{method.label}: {method.active ? "active" : "inactive"} / {method.defaultPreference}</li>)}</ul>
            <h4>Messages and Visibility</h4>
            <p>{selected.policies.readinessRoutingPolicy.proceedWithWarningsMessageTemplate}</p>
            <p>{selected.policies.packageOutputPolicy.packageWarningLanguageTemplate}</p>
            <p>Client-facing: {selected.policies.packageOutputPolicy.clientFacingVisibility.join(", ")}</p>
            <p>Admin/internal: {selected.policies.packageOutputPolicy.adminInternalVisibility.join(", ")}</p>
            <p>Visual markers: {selected.policies.visualMapPolicy.markerPreferences.join(", ")}</p>
          </div>

          <div className="card">
            <h3>Locked Governance Rules</h3>
            <ul>{selected.lockedGovernanceRules.map((rule) => <li key={rule.ruleId}><strong>{rule.label}</strong>: {rule.description}</li>)}</ul>
          </div>
        </>
      ) : null}
    </>
  );
}
