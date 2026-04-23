import Link from "next/link";
import { notFound } from "next/navigation";
import type { PackageSurfaceDetail } from "../../../lib/package-surface";
import { PackageClientView } from "./PackageClientView";

async function getPackageSurface(id: string): Promise<PackageSurfaceDetail | null> {
  const res = await fetch(
    `http://127.0.0.1:${process.env.PORT ?? 3000}/api/packages/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<PackageSurfaceDetail>;
}

export default async function PackageSurfaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const detail = await getPackageSurface(params.id);
  if (detail === null) notFound();

  return (
    <div className="package-surface-page">
      <section className="client-context-strip" data-testid="client-context-strip">
        <span>{detail.caseContext.domain}</span>
        <span>{detail.caseContext.mainDepartment}</span>
        <span>{detail.caseContext.subDepartment ?? "Core workflow"}</span>
        <span>{detail.caseContext.caseId}</span>
      </section>

      <p style={{ marginBottom: "8px" }}>
        <Link href="/packages" style={{ color: "#7af" }}>
          ← All delivery surfaces
        </Link>
      </p>

      <header className="package-header">
        <div>
          <div className="package-kicker">
            {detail.kind === "final_package" ? "Client delivery package" : "Client preview package"}
          </div>
          <h2>{detail.title}</h2>
          <p>{detail.subtitle}</p>
        </div>
      </header>

      <PackageClientView detail={detail} />
    </div>
  );
}
