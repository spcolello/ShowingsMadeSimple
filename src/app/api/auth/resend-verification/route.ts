import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabasePublic } from "@/lib/supabase";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));

  if (!payload.success) {
    return NextResponse.redirect(new URL("/login?error=Enter a valid email.", request.url), { status: 303 });
  }

  const supabase = getSupabasePublic();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=Supabase email verification is not configured.", request.url), {
      status: 303,
    });
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: payload.data.email,
    options: { emailRedirectTo: `${request.headers.get("origin") ?? new URL(request.url).origin}/api/auth/callback` },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(new URL("/login?resent=true", request.url), { status: 303 });
}
