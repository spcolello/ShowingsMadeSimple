import { NextResponse, type NextRequest } from "next/server";

const roleRoutes = [
  { prefix: "/buyer", role: "buyer" },
  { prefix: "/agent", role: "agent" },
  { prefix: "/admin", role: "admin" },
];

export function middleware(request: NextRequest) {
  const demoRole = request.cookies.get("sms_demo_role")?.value;
  const matched = roleRoutes.find((route) => request.nextUrl.pathname.startsWith(route.prefix));

  if (request.nextUrl.pathname.startsWith("/admin") && demoRole !== "admin") {
    return NextResponse.redirect(new URL("/login?error=Admin access required.", request.url));
  }

  if (matched && demoRole && demoRole !== matched.role) {
    const destination =
      demoRole === "buyer" ? "/buyer/dashboard" : demoRole === "agent" ? "/agent/dashboard" : "/admin";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/agent/:path*", "/admin/:path*"],
};
