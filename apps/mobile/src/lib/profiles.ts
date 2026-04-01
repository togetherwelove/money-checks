import type { ProfileDisplayRow } from "../types/supabase";
import { supabase } from "./supabase";

const PROFILE_TABLE = "profiles";

export async function fetchProfileDisplayName(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id, display_name")
    .eq("id", userId)
    .single<ProfileDisplayRow>();

  if (error) {
    throw error;
  }

  return data.display_name ?? "";
}

export async function fetchOwnProfileDisplayName(userId: string): Promise<string> {
  return fetchProfileDisplayName(userId);
}

export async function updateOwnProfileDisplayName(
  userId: string,
  displayName: string,
): Promise<string> {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .update({ display_name: displayName.trim() })
    .eq("id", userId)
    .select("id, display_name")
    .single<ProfileDisplayRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to update profile display name.");
  }

  return data.display_name ?? "";
}
