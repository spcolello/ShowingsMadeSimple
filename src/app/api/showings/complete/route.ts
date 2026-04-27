import { NextResponse } from "next/server";
import { completeShowing } from "@/lib/workflow";

export async function POST(request: Request) {
  const form = await request.formData();
  const showingId = String(form.get("showingId"));
  const agentId = String(form.get("agentId"));
  const result = await completeShowing(showingId, agentId);
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    return NextResponse.redirect(new URL("/agent/dashboard?completed=true", request.url), { status: 303 });
  }

  return NextResponse.json(result);
}
