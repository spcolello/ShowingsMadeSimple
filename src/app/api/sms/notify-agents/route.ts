import { NextResponse } from "next/server";
import { requireAppRole } from "@/lib/server-auth";
import { notifyMatchingAgents } from "@/lib/workflow";

export async function POST(request: Request) {
  const admin = await requireAppRole("admin");
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { showingId } = await request.json();
  const result = await notifyMatchingAgents(showingId);
  return NextResponse.json(result);
}
