import type { ProfileDisplayRow } from "../types/supabase";
import { isValidDisplayName } from "../utils/displayName";
import {
  getCachedProfileDisplayName,
  setCachedProfileDisplayName,
} from "./profileDisplayNameCache";
import { supabase } from "./supabase";

const PROFILE_TABLE = "profiles";
const INVALID_DISPLAY_NAME_ERROR = "Display name is required.";

export async function fetchProfileDisplayName(userId: string): Promise<string> {
  const cachedDisplayName = getCachedProfileDisplayName(userId);
  if (cachedDisplayName !== null) {
    return cachedDisplayName;
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id, display_name")
    .eq("id", userId)
    .single<ProfileDisplayRow>();

  if (error) {
    throw error;
  }

  const displayName = data.display_name ?? "";
  setCachedProfileDisplayName(userId, displayName);
  return displayName;
}

export async function fetchOwnProfileDisplayName(userId: string): Promise<string> {
  return fetchProfileDisplayName(userId);
}

export async function updateOwnProfileDisplayName(
  userId: string,
  displayName: string,
): Promise<string> {
  if (!isValidDisplayName(displayName)) {
    throw new Error(INVALID_DISPLAY_NAME_ERROR);
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .update({ display_name: displayName.trim() })
    .eq("id", userId)
    .select("id, display_name")
    .single<ProfileDisplayRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to update profile display name.");
  }

  const nextDisplayName = data.display_name ?? "";
  setCachedProfileDisplayName(userId, nextDisplayName);
  return nextDisplayName;
}
