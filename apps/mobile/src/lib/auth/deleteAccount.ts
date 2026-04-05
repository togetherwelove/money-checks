import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { supabase } from "../supabase";
import { deleteAccountRequest } from "./deleteAccountRequest";
import { resolveDeleteAccountAccessToken } from "./deleteAccountSession";

export async function deleteOwnAccount(): Promise<void> {
  const accessToken = await resolveDeleteAccountAccessToken(supabase.auth);

  await deleteAccountRequest({
    accessToken,
    invokeFn: supabase.functions.invoke.bind(supabase.functions),
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
