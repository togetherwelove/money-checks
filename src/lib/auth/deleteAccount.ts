import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { supabase } from "../supabase";
import { deleteAccountRequest } from "./deleteAccountRequest";

export async function deleteOwnAccount(): Promise<void> {
  await deleteAccountRequest({
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
