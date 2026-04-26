import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ role: z.enum(["buyer", "agent", "admin"]) });

export async function POST(request: Request) {
  const form = await request.formData();
  const { role } = schema.parse(Object.fromEntries(form));
  const path = role === "buyer" ? "/buyer/dashboard" : role === "agent" ? "/agent/dashboard" : "/admin";
  const response = NextResponse.redirect(new URL(path, request.url), { status: 303 });
  response.cookies.set("sms_demo_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  response.cookies.set("sms_user_id", `mock-${role}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
