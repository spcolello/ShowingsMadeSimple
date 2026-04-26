import { NextResponse } from "next/server";
import { completeShowing } from "@/lib/workflow";

export async function POST(request: Request) {
  const form = await request.formData();
  const showingId = String(form.get("showingId"));
  const agentId = String(form.get("agentId"));
  const result = await completeShowing(showingId, agentId);
  return NextResponse.json(result);
}
