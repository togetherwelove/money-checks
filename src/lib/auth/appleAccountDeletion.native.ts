import * as AppleAuthentication from "expo-apple-authentication";

import { AccountDeletionMessages } from "../../constants/accountDeletion";
import { appPlatform } from "../appPlatform";
import { supabase } from "../supabase";

export async function authorizeAppleAccountDeletion(): Promise<string | undefined> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user?.identities?.some((identity) => identity.provider === "apple")) return undefined;
  if (!appPlatform.isIOS) throw new Error(AccountDeletionMessages.appleRequiresIOS);

  const credential = await AppleAuthentication.signInAsync().catch(() => {
    throw new Error(AccountDeletionMessages.appleAuthorizationFailed);
  });
  if (!credential.authorizationCode) throw new Error(AccountDeletionMessages.appleAuthorizationFailed);
  return credential.authorizationCode;
}
