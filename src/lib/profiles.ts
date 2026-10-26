import type { ProfileDisplayRow } from "../types/supabase";
import { StartupCopy } from "../constants/startup";
import { isValidDisplayName, normalizeDisplayNameCandidate } from "../utils/displayName";
import {
  getCachedProfileDisplayName,
  setCachedProfileDisplayName,
} from "./profileDisplayNameCache";
import { supabase } from "./supabase";

const PROFILE_TABLE = "profiles";
const INVALID_DISPLAY_NAME_ERROR = "Display name is required.";

export async function fetchProfileDisplayName(userId: string, signal?: AbortSignal): Promise<string> {
  const cachedDisplayName = getCachedProfileDisplayName(userId);
  if (cachedDisplayName !== null) {
    return cachedDisplayName;
  }

  const query = supabase
    .from(PROFILE_TABLE)
    .select("id, display_name")
    .eq("id", userId);
  const { data, error } = await (signal ? query.abortSignal(signal) : query).single<ProfileDisplayRow>();
  if (signal?.aborted) throw new Error(StartupCopy.failed);

  if (error) {
    throw error;
  }

  const displayName = data.display_name ?? "";
  setCachedProfileDisplayName(userId, displayName);
  return displayName;
}

export async function fetchOwnProfileDisplayName(userId: string, signal?: AbortSignal): Promise<string> {
  return fetchProfileDisplayName(userId, signal);
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
