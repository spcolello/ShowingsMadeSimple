import { NextResponse } from "next/server";
import { notifyMatchingAgents } from "@/lib/workflow";

export async function POST(request: Request) {
  const { showingId } = await request.json();
  const result = await notifyMatchingAgents(showingId);
  return NextResponse.json(result);
}
