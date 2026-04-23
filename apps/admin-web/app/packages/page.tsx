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

export default async function PackagePreviewPage() {
  const records = await getPackages();
  const finalCount = records.filter((record) => record.kind === "final_package").length;
  const previewCount = records.filter((record) => record.kind === "initial_preview").length;
  const reviewVisibleCount = records.filter((record) => record.reviewItemCount > 0).length;

  return (
    <div className="package-surface-page">
      <section className="client-context-strip" data-testid="client-context-strip">
        <span>{uniqueCaseCount(records)} case views</span>
        <span>{finalCount} final delivery packages</span>
        <span>{previewCount} preview packages</span>
        <span>{reviewVisibleCount} review-visible items</span>
      </section>

      <header className="package-header">
        <div>
          <div className="package-kicker">Client-facing delivery surface</div>
          <h2>Workflow delivery packages</h2>
          <p>
            Unified package preview, workflow comparison, download, and release
            visibility built on accepted Pass 8 package logic.
          </p>
        </div>
      </header>

      <section className="package-overview-row" data-testid="package-overview-row">
        <div className="package-overview-card">
          <span className="package-card-label">Overview</span>
          <h3>{records.length} delivery surfaces</h3>
          <p>Client-facing package views available from accepted initial and final package outputs.</p>
        </div>
        <div className="package-overview-card">
          <span className="package-card-label">Release visibility</span>
          <h3>{finalCount} final packages</h3>
          <p>Release state and review visibility are presented read-only from the accepted Pass 8 and Pass 7 records.</p>
        </div>
      </section>

      <section className="package-list-section" data-testid="package-surface-list">
        <div className="package-panel-header">Available client-facing surfaces</div>
        {records.length === 0 ? (
          <div className="package-empty-state">
            No package surfaces exist yet. Create initial or final packages in the accepted Pass 6/8 flows first.
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
                  {record.linkedFinalPackageId ? (
                    <Link href={`/final-packages/${record.linkedFinalPackageId}`}>Admin detail</Link>
                  ) : (
                    <Link href={`/initial-packages/${record.linkedInitialPackageId}`}>Admin detail</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
