import Link from "next/link";

export default function HierarchyPage({ params }: { params: { id: string } }) {
  return (
    <>
      <h2>Hierarchy Intake Deferred</h2>
      <p>
        <Link href={`/intake-sessions/${params.id}`}>&larr; Session detail</Link>
      </p>
      <div className="card">
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          Hierarchy intake is outside Pass 2 Phase 3 and has not been started.
        </p>
      </div>
    </>
  );
}
