import { supabase } from "../supabase";

export async function signOutFromApp(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
