import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createShowingRequest } from "@/lib/workflow";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z
  .object({
    propertyAddress: z.string().optional(),
    mlsNumber: z.string().optional(),
    propertySummary: z.string().min(3),
    zipCode: z.string().min(5),
    preferredTime: z.string().min(1),
    safetyNotes: z.string().optional(),
    attendees: z.coerce.number().int().min(1).max(8),
    seriousInterest: z.literal("true").transform(() => true),
  })
  .refine((value) => Boolean(value.propertyAddress?.trim() || value.mlsNumber?.trim()), {
    message: "Enter either a property address or MLS number.",
    path: ["propertyAddress"],
  });

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));

  if (!payload.success) {
    return NextResponse.redirect(
      new URL("/buyer/dashboard?tab=request&error=Enter property details, showing time, and safety agreement.", request.url),
      { status: 303 },
    );
  }

  const userId = (await cookies()).get("sms_user_id")?.value;
  const role = (await cookies()).get("sms_demo_role")?.value;
  if (!userId || role !== "buyer") {
    return NextResponse.redirect(new URL("/login?error=Buyer login required.", request.url), { status: 303 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.redirect(
      new URL("/api/stripe/checkout?showingId=local-new-showing", request.url),
      { status: 303 },
    );
  }

  let buyerId = userId.startsWith("mock-") ? undefined : userId;
  const supabase = getSupabaseAdmin();
  if (supabase && !userId.startsWith("mock-")) {
    const { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    buyerId = buyer?.id;
  }

  try {
    const showing = await createShowingRequest({
      ...payload.data,
      buyerId,
      propertyAddress: payload.data.propertyAddress?.trim() || `MLS ${payload.data.mlsNumber}`,
      mlsNumber: payload.data.mlsNumber?.trim() || undefined,
    });

    return NextResponse.redirect(
      new URL(`/api/stripe/checkout?showingId=${showing.id}`, request.url),
      { status: 303 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Showing request could not be created.";
    return NextResponse.redirect(
      new URL(`/buyer/dashboard?tab=request&error=${encodeURIComponent(message)}`, request.url),
      { status: 303 },
    );
  }
}
