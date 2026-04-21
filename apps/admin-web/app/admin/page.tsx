export default function AdminConfigPage() {
  return (
    <>
      <h2>Admin config</h2>
      <p className="muted">Placeholder. Admin configuration UI lands in Pass 3.</p>
      <div className="card">
        <p>Will surface: LLM provider config, storage config, feature flags,
        operator/reviewer roster.</p>
        <p className="muted">Owners: <code>@workflow/integrations</code>,{" "}
        <code>@workflow/persistence</code>.</p>
      </div>
    </>
  );
}
