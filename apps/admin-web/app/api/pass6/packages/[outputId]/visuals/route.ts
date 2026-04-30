import { blockedOldPass6TestSurfaceResponse } from "../../../blocked-test-surface";

export async function GET() {
  return blockedOldPass6TestSurfaceResponse("api/pass6/packages/[outputId]/visuals");
}

export async function POST() {
  return blockedOldPass6TestSurfaceResponse("api/pass6/packages/[outputId]/visuals");
}
