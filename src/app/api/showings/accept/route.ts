import { NextResponse } from "next/server";
import { getAuthenticatedProfileId } from "@/lib/server-auth";
import { acceptShowingRequest } from "@/lib/workflow";

export async function POST(request: Request) {
  const form = await request.formData();
  const showingId = String(form.get("showingId"));
  const agentId = String(form.get("agentId"));

  const authenticatedAgentId = await getAuthenticatedProfileId("agent");
  if (!authenticatedAgentId || authenticatedAgentId !== agentId) {
    return NextResponse.redirect(new URL("/login?error=Agent login required.", request.url), { status: 303 });
  }

  const result = await acceptShowingRequest(showingId, agentId);

  if (!result.accepted) {
    const message = "message" in result ? String(result.message) : "This showing could not be accepted.";
    return NextResponse.redirect(
      new URL(`/agent/accept/${showingId}?agent=${agentId}&error=${encodeURIComponent(message)}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(new URL("/agent/dashboard?accepted=true", request.url), {
    status: 303,
  });
}
