import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "donation-images";

/** Uploads files to the caller's own folder and returns storage paths. */
export async function uploadDonationImages(userId: string, files: File[]) {
  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

/** Resolves storage paths to temporary viewable URLs. */
export async function signedUrls(paths: string[]) {
  if (paths.length === 0) return [];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}

export function useObjectUrls() {
  return (files: File[]) => files.map((f) => URL.createObjectURL(f));
}
