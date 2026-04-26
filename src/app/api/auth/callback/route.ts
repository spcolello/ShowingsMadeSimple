import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = getSupabasePublic();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
        { status: 303 },
      );
    }
  }

  return NextResponse.redirect(new URL("/login?verified=true", request.url), { status: 303 });
}
