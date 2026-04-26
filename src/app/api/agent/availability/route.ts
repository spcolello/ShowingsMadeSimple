import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  agentId: z.string().optional(),
  availableDays: z.string().min(1),
  availableStartTime: z.string().min(1),
  availableEndTime: z.string().min(1),
  serviceRadiusMiles: z.coerce.number().int().min(1).max(100),
  isAvailable: z.string().optional(),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.parse(Object.fromEntries(form));
  const supabase = getSupabaseAdmin();

  if (supabase && payload.agentId) {
    await supabase.from("agent_profiles").update({
      available_days: payload.availableDays.split(",").map((day) => day.trim()).filter(Boolean),
      available_start_time: payload.availableStartTime,
      available_end_time: payload.availableEndTime,
      service_radius_miles: payload.serviceRadiusMiles,
      is_available: payload.isAvailable === "true",
    }).eq("id", payload.agentId);
  }

  return NextResponse.redirect(new URL("/agent/dashboard?availability=saved", request.url), { status: 303 });
}
