import { env } from "./env";
import { getSupabaseAdmin } from "./supabase";

export async function uploadBuyerDocument(ownerId: string, file: File | null, type: string) {
  if (!file || file.size === 0) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${ownerId}/${type}-${Date.now()}-${safeName}`;

  if (!supabase) {
    return `mock://buyer-verification/${path}`;
  }

  const { error } = await supabase.storage
    .from("buyer-verification")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) {
    throw error;
  }

  return `supabase://buyer-verification/${path}`;
}

export async function sendBuyerVerificationEmail(email: string, redirectTo = `${env.appUrl}/api/auth/callback`) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    console.info("[mock email verification]", { email, code: "123456" });
    return { mocked: true };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw error;
  }

  return { mocked: false };
}
