import { getSupabaseAdmin } from "./supabase";

export function parseSupabaseStorageUrl(value?: string | null) {
  if (!value?.startsWith("supabase://")) {
    return null;
  }

  const withoutScheme = value.replace("supabase://", "");
  const slashIndex = withoutScheme.indexOf("/");
  if (slashIndex < 1) {
    return null;
  }

  return {
    bucket: withoutScheme.slice(0, slashIndex),
    path: withoutScheme.slice(slashIndex + 1),
  };
}

export async function createDocumentViewUrl(storagePath?: string | null) {
  const parsed = parseSupabaseStorageUrl(storagePath);
  const supabase = getSupabaseAdmin();

  if (!parsed || !supabase) {
    return null;
  }

  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, 60 * 60);
  if (error) {
    return null;
  }

  return data.signedUrl;
}
