import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth-cookies";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  if (!env.enableDemoAccess) {
    return NextResponse.redirect(
      new URL("/login?error=Mock login is disabled.", request.url),
      { status: 303 },
    );
  }

  if (email === "admin@gmail.com" && password === "admin") {
    const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
    setAuthCookies(response, "admin", "mock-admin");
    return response;
  }

  return NextResponse.redirect(
    new URL("/login?error=Invalid mock admin credentials.", request.url),
    { status: 303 },
  );
}
