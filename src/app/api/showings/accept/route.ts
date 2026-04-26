import { NextResponse } from "next/server";
import { acceptShowingRequest } from "@/lib/workflow";

export async function POST(request: Request) {
  const form = await request.formData();
  const showingId = String(form.get("showingId"));
  const agentId = String(form.get("agentId"));
  const result = await acceptShowingRequest(showingId, agentId);

  if (!result.accepted) {
    return NextResponse.redirect(
      new URL(`/agent/accept/${showingId}?agent=${agentId}&claimed=true`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(new URL("/agent/dashboard?accepted=true", request.url), {
    status: 303,
  });
}
