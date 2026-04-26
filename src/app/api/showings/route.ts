import { NextResponse } from "next/server";
import { z } from "zod";
import { createShowingRequest } from "@/lib/workflow";

const schema = z.object({
  propertyAddress: z.string().min(5),
  mlsNumber: z.string().optional(),
  propertySummary: z.string().min(3),
  zipCode: z.string().min(5),
  preferredTime: z.string().min(1),
  safetyNotes: z.string().optional(),
  attendees: z.coerce.number().int().min(1).max(8),
  seriousInterest: z.literal("true").transform(() => true),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.parse(Object.fromEntries(form));
  const showing = await createShowingRequest(payload);

  return NextResponse.redirect(
    new URL(`/api/stripe/checkout?showingId=${showing.id}`, request.url),
    { status: 303 },
  );
}
