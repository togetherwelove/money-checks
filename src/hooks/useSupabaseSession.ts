import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

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

    const syncAutoRefresh = (appState: AppStateStatus) => {
      if (appState === "active") {
        void supabase.auth.startAutoRefresh();
        return;
      }

      void supabase.auth.stopAutoRefresh();
    };

    const appStateSubscription =
      Platform.OS === "web" ? null : AppState.addEventListener("change", syncAutoRefresh);

    if (Platform.OS !== "web") {
      syncAutoRefresh(AppState.currentState);
    }

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
      appStateSubscription?.remove();
      if (Platform.OS !== "web") {
        void supabase.auth.stopAutoRefresh();
      }
      subscription.unsubscribe();
    };
  }, []);

  return sessionState;
}
