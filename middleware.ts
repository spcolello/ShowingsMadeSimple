import { NextResponse, type NextRequest } from "next/server";

const roleRoutes = [
  { prefix: "/buyer", role: "buyer" },
  { prefix: "/agent", role: "agent" },
  { prefix: "/admin", role: "admin" },
];

export function middleware(request: NextRequest) {
  const demoRole = request.cookies.get("sms_demo_role")?.value;
  const matched = roleRoutes.find((route) => request.nextUrl.pathname.startsWith(route.prefix));

  if (matched && demoRole && demoRole !== matched.role) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/agent/:path*", "/admin/:path*"],
};
