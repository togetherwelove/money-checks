import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import { type SessionState, createResolvedSessionState, loadInitialSession } from "./sessionState";

export function useSupabaseSession(): SessionState {
  const [sessionState, setSessionState] = useState<SessionState>({
    errorMessage: null,
    isLoading: true,
    session: null,
  });

  useEffect(() => {
    let isMounted = true;

    void loadInitialSession(() => supabase.auth.getSession()).then((nextState) => {
      if (!isMounted) {
        return;
      }
      setSessionState(nextState);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setSessionState(createResolvedSessionState(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return sessionState;
}
