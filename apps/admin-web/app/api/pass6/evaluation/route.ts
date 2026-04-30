import { blockedOldPass6TestSurfaceResponse } from "../blocked-test-surface";

export async function GET() {
  return blockedOldPass6TestSurfaceResponse("api/pass6/evaluation");
}
