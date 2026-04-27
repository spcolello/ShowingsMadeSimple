import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const schema = z.object({
  agentId: z.string().optional(),
  serviceLocation: z.string().optional(),
  serviceRadiusMiles: z.coerce.number().int().min(1).max(100),
  isAvailable: z.string().optional(),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.parse(Object.fromEntries(form));
  const selectedDays = form.getAll("availableDays").map(String).filter((day) => days.includes(day as typeof days[number]));
  const supabase = getSupabaseAdmin();

  if (supabase && payload.agentId) {
    const availabilityRows = selectedDays.map((day) => {
      const dayIndex = days.indexOf(day as typeof days[number]);
      return {
        agent_id: payload.agentId,
        day_of_week: dayIndex,
        start_time: String(form.get(`startTime_${day}`) || "09:00"),
        end_time: String(form.get(`endTime_${day}`) || "17:00"),
      };
    });

    await supabase.from("agent_profiles").update({
      available_days: selectedDays,
      available_start_time: availabilityRows[0]?.start_time ?? null,
      available_end_time: availabilityRows[0]?.end_time ?? null,
      service_location: payload.serviceLocation?.trim() || null,
      service_radius_miles: payload.serviceRadiusMiles,
      is_available: payload.isAvailable === "true",
    }).eq("id", payload.agentId);

    await supabase.from("agent_availability").delete().eq("agent_id", payload.agentId);
    if (availabilityRows.length > 0) {
      await supabase.from("agent_availability").insert(availabilityRows);
    }
  }

  return NextResponse.redirect(new URL("/agent/dashboard?availability=saved", request.url), { status: 303 });
}
