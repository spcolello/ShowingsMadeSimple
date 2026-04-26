import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getSupabasePublic } from "@/lib/supabase";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));

  if (!payload.success) {
    return NextResponse.redirect(new URL("/forgot-password?error=Enter a valid email.", request.url), {
      status: 303,
    });
  }

  const supabase = getSupabasePublic();
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=Supabase auth is not configured.", request.url),
      { status: 303 },
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(payload.data.email, {
    redirectTo: `${env.appUrl}/login`,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/forgot-password?error=${encodeURIComponent(error.message)}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(new URL("/forgot-password?sent=true", request.url), { status: 303 });
}
