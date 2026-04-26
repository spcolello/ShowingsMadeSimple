import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  if (process.env.NODE_ENV === "production") {
    return NextResponse.redirect(
      new URL("/login?error=Mock login is disabled in production.", request.url),
      { status: 303 },
    );
  }

  if (email === "admin@gmail.com" && password === "admin") {
    const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
    response.cookies.set("sms_demo_role", "admin", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  return NextResponse.redirect(
    new URL("/login?error=Invalid mock admin credentials.", request.url),
    { status: 303 },
  );
}
