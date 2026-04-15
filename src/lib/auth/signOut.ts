import { removeStoredPushDeviceToken } from "../notifications/pushDeviceTokens";
import { supabase } from "../supabase";

export async function signOutFromApp(): Promise<void> {
  if (typeof supabase.auth.getSession === "function") {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user.id) {
      await removeStoredPushDeviceToken(session.user.id).catch(() => undefined);
    }
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
