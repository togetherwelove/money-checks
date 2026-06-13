import { clearStoredPushDeviceToken } from "../notifications/pushDeviceTokens";
import { supabase } from "../supabase";
import { supabasePublishableKey, supabaseUrl } from "../supabase";
import { deleteAccountRequest } from "./deleteAccountRequest";
import { resolveDeleteAccountAccessToken } from "./resolveDeleteAccountAccessToken";

const DELETE_ACCOUNT_FUNCTION_PATH = "/functions/v1/delete-account";

export async function deleteOwnAccount(): Promise<void> {
  const accessToken = await resolveDeleteAccountAccessToken(supabase.auth);

  await deleteAccountRequest({
    accessToken,
    fetchFn: fetch,
    functionUrl: `${supabaseUrl}${DELETE_ACCOUNT_FUNCTION_PATH}`,
    publishableKey: supabasePublishableKey,
    onDeleted: async () => {
      clearStoredPushDeviceToken();
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    },
  }).catch((error) => {
    console.error("[deleteOwnAccount] Delete account failed", error);
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
  });
}
