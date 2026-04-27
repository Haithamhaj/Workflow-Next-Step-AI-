import {
  findPass6MethodRegistryItem,
  resolvePass6MethodRegistryForAdmin,
} from "@workflow/synthesis-evaluation";
import type { AnalysisMethodKey } from "@workflow/contracts";
import { store } from "../../../../lib/store";

interface Pass6MethodDetailPageProps {
  params: {
    methodKey: AnalysisMethodKey;
  };
}

function List({ items }: { items: string[] }) {
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export default function Pass6MethodDetailPage({ params }: Pass6MethodDetailPageProps) {
  const method = findPass6MethodRegistryItem(params.methodKey, store.pass6ConfigurationProfiles);
  const registry = resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles);

  if (!method) {
    return (
      <>
        <h2>Pass 6 Method Detail</h2>
        <div className="card">
          <p>Method not found.</p>
          <p><a href="/pass6/methods">Back to Pass 6 Method Registry</a></p>
        </div>
      </>
    );
  }

  const rules = registry.defaultSelectionRules.filter((rule) => rule.primaryMethodKey === method.methodKey);

  return (
    <>
      <h2>{method.displayName}</h2>
      <p className="muted"><a href="/pass6/methods">Back to Pass 6 Method Registry</a></p>

      <div className="card">
        <h3>Method Metadata</h3>
        <p><strong>Method ID:</strong> {method.methodId}</p>
        <p><strong>Method key:</strong> {method.methodKey}</p>
        <p><strong>Type:</strong> {method.methodType}</p>
        <p><strong>Status:</strong> {method.active ? "active" : "inactive"}</p>
        <p><strong>Version:</strong> {method.methodVersion}</p>
        <p>{method.adminFacingDescription}</p>
      </div>

      <div className="card">
        <h3>Normal Use Cases</h3>
        <List items={method.normalUseCases} />
        <h3>Required Inputs</h3>
        <List items={method.requiredInputs} />
        <h3>Expected Outputs</h3>
        <List items={method.expectedOutputs} />
      </div>

      <div className="card">
        <h3>Impact and Limits</h3>
        <h4>Can Affect Later</h4>
        <List items={method.scoringOrClassificationImpact} />
        <h4>Limitations</h4>
        <List items={method.limitations} />
        <h4>Hard Boundaries</h4>
        <List items={method.hardBoundaries} />
      </div>

      <div className="card">
        <h3>Default Selection Rules</h3>
        {rules.length === 0 ? <p className="muted">No default primary selection rule for this method.</p> : null}
        {rules.map((rule) => (
          <div key={rule.ruleId}>
            <p><strong>{rule.problemType}</strong></p>
            <p>{rule.rationale}</p>
            <p><strong>Signals:</strong> {rule.problemSignals.join(", ")}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Traceability Scaffold</h3>
        <p><strong>System-selected shape:</strong> {registry.traceabilityShape.systemSelectedExample.selectionSource} / {registry.traceabilityShape.systemSelectedExample.methodRole}</p>
        <p><strong>Admin-forced shape:</strong> {registry.traceabilityShape.adminForcedExample.selectionSource} / {registry.traceabilityShape.adminForcedExample.methodRole}</p>
        <p className="muted">Traceability shape is a scaffold only. No method execution occurs in Block 8.</p>
      </div>
    </>
  );
}
