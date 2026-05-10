import { NextResponse } from "next/server";
import { z } from "zod";
import { setAuthCookies } from "@/lib/auth-cookies";
import { env } from "@/lib/env";

const schema = z.object({ role: z.enum(["buyer", "agent", "admin"]) });

export async function POST(request: Request) {
  if (!env.enableDemoAccess) {
    return NextResponse.redirect(new URL("/login?error=Demo access is disabled.", request.url), { status: 303 });
  }

  const form = await request.formData();
  const { role } = schema.parse(Object.fromEntries(form));
  const path = role === "buyer" ? "/buyer/dashboard" : role === "agent" ? "/agent/dashboard" : "/admin";
  const response = NextResponse.redirect(new URL(path, request.url), { status: 303 });
  setAuthCookies(response, role, `mock-${role}`);
  return response;
}
