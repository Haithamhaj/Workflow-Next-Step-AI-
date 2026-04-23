import { NextResponse } from "next/server";
import { listPackageSurfaceItems } from "../../../lib/package-surface";
import { store } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listPackageSurfaceItems(store));
}
