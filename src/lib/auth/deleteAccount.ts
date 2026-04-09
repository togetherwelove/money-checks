import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { SupabaseFunctions } from "../../constants/supabaseFunctions";
import { supabase } from "../supabase";
import { supabasePublishableKey, supabaseUrl } from "../supabase";
import { deleteAccountRequest } from "./deleteAccountRequest";
import { resolveDeleteAccountAccessToken } from "./resolveDeleteAccountAccessToken";

export async function deleteOwnAccount(): Promise<void> {
  const accessToken = await resolveDeleteAccountAccessToken(supabase.auth);

  await deleteAccountRequest({
    accessToken,
    fetchFn: fetch,
    functionUrl: `${supabaseUrl}${SupabaseFunctions.deleteAccountPath}`,
    publishableKey: supabasePublishableKey,
    onDeleted: async () => {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    },
  }).catch((error) => {
    console.error("[deleteOwnAccount] Delete account failed", error);
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(AccountDeletionMessages.errorFallback);
  });
}
