import { isProduction } from "./env";

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction(),
  path: "/",
  maxAge: 60 * 60 * 8,
};

export function setAuthCookies(
  response: {
    cookies: {
      set: (name: string, value: string, options: typeof authCookieOptions) => void;
    };
  },
  role: string,
  userId: string,
) {
  response.cookies.set("sms_demo_role", role, authCookieOptions);
  response.cookies.set("sms_user_id", userId, authCookieOptions);
}
