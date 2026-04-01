import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

type SessionState = {
  isLoading: boolean;
  session: Session | null;
};

export function useSupabaseSession(): SessionState {
  const [sessionState, setSessionState] = useState<SessionState>({
    isLoading: true,
    session: null,
  });

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setSessionState({ isLoading: false, session: data.session });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setSessionState({ isLoading: false, session });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return sessionState;
}
