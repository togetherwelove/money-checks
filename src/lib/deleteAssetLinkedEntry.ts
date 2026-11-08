import { logAppError } from "./logAppError";
import { supabase } from "./supabase";

export async function deleteAssetLinkedEntry(entryId: string) {
  const { data, error } = await supabase.rpc("delete_asset_linked_entry", { p_entry: entryId });
  if (error) throw error;
  const files = (data ?? []) as { storage_bucket: string; storage_path: string }[];
  const byBucket = new Map<string, string[]>();
  for (const file of files) {
    const paths = byBucket.get(file.storage_bucket) ?? [];
    paths.push(file.storage_path);
    byBucket.set(file.storage_bucket, paths);
  }
  // Storage failures must not report a committed transaction deletion as failed.
  for (const [bucket, paths] of byBucket) {
    try {
      const result = await supabase.storage.from(bucket).remove(paths);
      if (result.error) throw result.error;
    } catch (cleanupError) {
      logAppError("AssetLinks", cleanupError, { step: "delete_attachment_storage" });
    }
  }
}
