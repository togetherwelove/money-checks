import { type SubscriptionTier, SubscriptionTiers } from "../../constants/subscription";
import { supabase } from "../supabase";

const SYNC_REVENUECAT_SUBSCRIPTION_FUNCTION = "sync-revenuecat-subscription";
const UNKNOWN_FUNCTION_ERROR_STATUS = "unknown";

type SyncRevenueCatSubscriptionResponse = {
  subscriptionTier?: SubscriptionTier;
};

export async function syncRevenueCatSubscriptionTier(): Promise<SubscriptionTier | null> {
  const { data, error } = await supabase.functions.invoke<SyncRevenueCatSubscriptionResponse>(
    SYNC_REVENUECAT_SUBSCRIPTION_FUNCTION,
    { method: "POST" },
  );

  if (error) {
    throw await enrichFunctionError(error);
  }

  if (
    data?.subscriptionTier === SubscriptionTiers.free ||
    data?.subscriptionTier === SubscriptionTiers.plus
  ) {
    return data.subscriptionTier;
  }

  return null;
}

async function enrichFunctionError(error: unknown): Promise<Error> {
  const response = readFunctionErrorResponse(error);
  if (!response) {
    return error instanceof Error ? error : new Error("Subscription sync failed.");
  }

  const responseText = await response.text().catch(() => "");
  const status = response.status || UNKNOWN_FUNCTION_ERROR_STATUS;
  const details = responseText ? ` ${responseText}` : "";

  return new Error(`Subscription sync failed with status ${status}.${details}`);
}

function readFunctionErrorResponse(error: unknown): Response | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as { context?: unknown };
  return candidate.context instanceof Response ? candidate.context : null;
}
