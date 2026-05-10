import { NextResponse } from "next/server";
import { getAuthenticatedProfileId } from "@/lib/server-auth";
import { completeShowing } from "@/lib/workflow";

export async function POST(request: Request) {
  const form = await request.formData();
  const showingId = String(form.get("showingId"));
  const agentId = String(form.get("agentId"));
  const contentType = request.headers.get("content-type") ?? "";

  const authenticatedAgentId = await getAuthenticatedProfileId("agent");
  if (!authenticatedAgentId || authenticatedAgentId !== agentId) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Agent login required." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/login?error=Agent login required.", request.url), { status: 303 });
  }

  const result = await completeShowing(showingId, agentId);

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    return NextResponse.redirect(new URL("/agent/dashboard?completed=true", request.url), { status: 303 });
  }

  return NextResponse.json(result);
}
