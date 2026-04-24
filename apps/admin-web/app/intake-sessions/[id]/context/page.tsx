import Link from "next/link";
import { notFound } from "next/navigation";
import { PRIMARY_DEPARTMENTS, assertPreHierarchyReady } from "@workflow/sources-context";
import { store } from "../../../../lib/store";
import DepartmentContextClient from "./DepartmentContextClient";

export const dynamic = "force-dynamic";

export default function DepartmentContextPage({ params }: { params: { id: string } }) {
  const session = store.intakeSessions.findById(params.id);
  if (!session) notFound();
  const framing = store.departmentFraming.findBySessionId(params.id);
  const structuredContext = store.structuredContexts.findBySessionId(params.id);
  const initial = {
    primaryDepartments: PRIMARY_DEPARTMENTS,
    framing,
    readiness: assertPreHierarchyReady(framing),
    structuredContext,
  };

  return (
    <>
      <h2>Department and Structured Context</h2>
      <p><Link href={`/intake-sessions/${params.id}`}>&larr; Back to intake session</Link></p>
      <p className="muted">
        Phase 6 frames department/use-case context only. It does not start hierarchy intake, rollout, synthesis, final package, or video input.
      </p>
      <DepartmentContextClient
        sessionId={params.id}
        primaryDepartments={PRIMARY_DEPARTMENTS}
        initial={initial}
      />
    </>
  );
}
