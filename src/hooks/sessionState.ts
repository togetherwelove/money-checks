import type { Session } from "@supabase/supabase-js";

import { runStartupCheck, startupErrorMessage } from "../lib/startupCheck";

export type SessionState = {
  errorMessage: string | null;
  isLoading: boolean;
  session: Session | null;
};

type SessionResponse = {
  error?: unknown;
  data: {
    session: Session | null;
  };
};

export async function loadInitialSession(
  getSession: () => Promise<SessionResponse>,
  signal: AbortSignal,
): Promise<SessionState> {
  try {
    const { data, error } = await runStartupCheck(getSession, signal);
    if (error) throw error;
    return {
      errorMessage: null,
      isLoading: false,
      session: data.session,
    };
  } catch (error) {
    return createSessionErrorState(error);
  }
}

export function createResolvedSessionState(session: Session | null): SessionState {
  return {
    errorMessage: null,
    isLoading: false,
    session,
  };
}

function createSessionErrorState(error: unknown): SessionState {
  return {
    errorMessage: startupErrorMessage(error),
    isLoading: false,
    session: null,
  };
}
