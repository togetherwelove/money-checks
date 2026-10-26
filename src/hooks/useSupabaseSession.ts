import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

import { supabase } from "../lib/supabase";
import { type SessionState, createResolvedSessionState, loadInitialSession } from "./sessionState";

export function useSupabaseSession(): SessionState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>({
    errorMessage: null,
    isLoading: true,
    session: null,
  });

  useEffect(() => {
    let isMounted = true;
    let hasResolvedSession = false;
    const controller = new AbortController();

    const syncAutoRefresh = (appState: typeof AppState.currentState) => {
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

    void loadInitialSession(() => supabase.auth.getSession(), controller.signal).then((nextState) => {
      if (!isMounted) {
        return;
      }
      hasResolvedSession = !nextState.errorMessage;
      setSessionState(nextState);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted || !hasResolvedSession || _event === "INITIAL_SESSION") {
        return;
      }
      setSessionState(createResolvedSessionState(session));
    });

    return () => {
      isMounted = false;
      controller.abort();
      appStateSubscription?.remove();
      if (Platform.OS !== "web") {
        void supabase.auth.stopAutoRefresh();
      }
      subscription.unsubscribe();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setSessionState({ errorMessage: null, isLoading: true, session: null });
    setAttempt((value) => value + 1);
  }, []);

  return { ...sessionState, retry };
}
