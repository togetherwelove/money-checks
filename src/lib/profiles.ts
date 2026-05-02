import type { ProfileDisplayRow } from "../types/supabase";
import { isValidDisplayName, normalizeDisplayNameCandidate } from "../utils/displayName";
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

  const { data, error } = await supabase.rpc("update_own_profile_display_name", {
    next_display_name: displayName,
  });

  if (error || typeof data !== "string") {
    throw error ?? new Error("Failed to update profile display name.");
  }

  const nextDisplayName = data;
  setCachedProfileDisplayName(userId, nextDisplayName);
  return nextDisplayName;
}

export async function syncOwnProfileDisplayNameIfMissing(
  userId: string,
  fallbackDisplayName: string,
): Promise<string> {
  const currentDisplayName = await fetchOwnProfileDisplayName(userId);
  const normalizedCurrentDisplayName = normalizeDisplayNameCandidate(currentDisplayName);
  const normalizedFallbackDisplayName = normalizeDisplayNameCandidate(fallbackDisplayName);

  if (normalizedCurrentDisplayName || !normalizedFallbackDisplayName) {
    return currentDisplayName;
  }

  return updateOwnProfileDisplayName(userId, normalizedFallbackDisplayName);
}
