import Link from "next/link";
import type { PackageSurfaceListItem } from "../../lib/package-surface";

async function getPackages(): Promise<PackageSurfaceListItem[]> {
  const res = await fetch(
    `http://127.0.0.1:${process.env.PORT ?? 3000}/api/packages`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json() as Promise<PackageSurfaceListItem[]>;
}

function uniqueCaseCount(records: PackageSurfaceListItem[]): number {
  return new Set(records.map((record) => record.caseContext.caseId)).size;
}

function uniqueDomains(records: PackageSurfaceListItem[]): string[] {
  return [...new Set(records.map((record) => record.caseContext.domain))];
}

function uniqueDepartments(records: PackageSurfaceListItem[]): string[] {
  return [...new Set(records.map((record) => record.caseContext.mainDepartment))];
}

export default async function PackagePreviewPage() {
  const records = await getPackages();
  const finalCount = records.filter((record) => record.kind === "final_package").length;

  return (
    <div className="package-surface-page">
      <section className="product-context-strip" data-testid="product-context-strip">
        <span>{uniqueDomains(records).join(" · ") || "All domains"}</span>
        <span>{uniqueDepartments(records).join(" · ") || "All departments"}</span>
        <span>{records.length} packages · {uniqueCaseCount(records)} cases</span>
      </section>

      <header className="package-header">
        <div>
          <div className="package-kicker">Packages</div>
          <h2>Workflow delivery packages</h2>
          <p>
            Unified workflow package views with preview, comparison, export, and release status.
          </p>
        </div>
      </header>

      <section className="package-summary-row" data-testid="package-summary-row">
        <div className="package-overview-card">
          <span className="package-card-label">Overview</span>
          <h3>{records.length} delivery surfaces</h3>
          <p>Package views covering initial previews and final deliverables.</p>
        </div>
        <div className="package-overview-card">
          <span className="package-card-label">Release visibility</span>
          <h3>{finalCount} final packages</h3>
          <p>Release state and review visibility across all workflow packages.</p>
        </div>
      </section>

      <section className="package-list-section" data-testid="package-surface-list">
        <div className="package-panel-header">Available packages</div>
        {records.length === 0 ? (
          <div className="package-empty-state">
            No packages available yet. Packages will appear here once created through the workflow.
          </div>
        ) : (
          <div className="package-list-grid">
            {records.map((record) => (
              <article key={`${record.kind}-${record.id}`} className="package-list-card">
                <div className="package-list-meta">
                  <span>{record.kind === "final_package" ? "Final delivery" : "Initial preview"}</span>
                  <span>{record.caseContext.domain}</span>
                </div>
                <h3>{record.title}</h3>
                <p>{record.subtitle}</p>
                <div className="package-pill-list">
                  <span className="package-chip">{record.packageStateLabel}</span>
                  <span className="package-chip">{record.releaseStateLabel}</span>
                  <span className="package-chip">{record.reviewVisibilityLabel}</span>
                </div>
                <div className="package-list-links">
                  <Link href={`/packages/${record.id}`}>Open surface</Link>
                  <Link href={record.downloadHref}>Download</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
