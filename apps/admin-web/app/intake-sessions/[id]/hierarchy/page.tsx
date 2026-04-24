import Link from "next/link";
import { getHierarchyFoundationState } from "@workflow/hierarchy-intake";
import { store } from "../../../../lib/store";
import HierarchyFoundationClient from "./HierarchyFoundationClient";

export default function HierarchyPage({ params }: { params: { id: string } }) {
  const state = getHierarchyFoundationState(params.id, {
    intakeSessions: store.intakeSessions,
    hierarchyIntakes: store.hierarchyIntakes,
    hierarchyDrafts: store.hierarchyDrafts,
    hierarchyCorrections: store.hierarchyCorrections,
    approvedHierarchySnapshots: store.approvedHierarchySnapshots,
    hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
  });

  return (
    <>
      <h2>Hierarchy Intake & Structural Approval</h2>
      <p>
        <Link href={`/intake-sessions/${params.id}`}>&larr; Session detail</Link>
      </p>
      <HierarchyFoundationClient sessionId={params.id} initialState={state} />
    </>
  );
}
