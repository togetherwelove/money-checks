import type { Session } from "@supabase/supabase-js";

import { AppMessages } from "../constants/messages";

export type SessionState = {
  errorMessage: string | null;
  isLoading: boolean;
  session: Session | null;
};

type SessionResponse = {
  data: {
    session: Session | null;
  };
};

export async function loadInitialSession(
  getSession: () => Promise<SessionResponse>,
): Promise<SessionState> {
  try {
    const { data } = await getSession();
    return {
      errorMessage: null,
      isLoading: false,
      session: data.session,
    };
  } catch {
    return createSessionErrorState();
  }
}

export function createResolvedSessionState(session: Session | null): SessionState {
  return {
    errorMessage: null,
    isLoading: false,
    session,
  };
}

export function createSessionErrorState(): SessionState {
  return {
    errorMessage: AppMessages.authSessionError,
    isLoading: false,
    session: null,
  };
}
