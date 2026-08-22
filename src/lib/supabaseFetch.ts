import { SupabaseRetry } from "../constants/supabaseRetry";

const JWT_CLAIMS_ERROR_CODE = "PGRST303";
const JWT_ISSUED_AT_FUTURE_ERROR_MESSAGE = "JWT issued at future";
const UNAUTHORIZED_STATUS = 401;

type PostgrestErrorPayload = {
  code?: string | null;
  message?: string | null;
};

const nativeFetch = globalThis.fetch.bind(globalThis);

export const supabaseFetchWithClockSkewRetry: typeof fetch = async (input, init) => {
  for (let attempt = 1; attempt <= SupabaseRetry.jwtClockSkewMaxAttempts; attempt += 1) {
    const response = await executeFetchAttempt(input, init);
    const shouldRetry = await isJwtIssuedAtFutureResponse(response);

    if (!shouldRetry || attempt === SupabaseRetry.jwtClockSkewMaxAttempts) {
      return response;
    }

    await delay(SupabaseRetry.jwtClockSkewDelayMs);
  }

  throw new Error("Supabase request retry ended unexpectedly.");
};

function executeFetchAttempt(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof Request !== "undefined" && input instanceof Request) {
    return nativeFetch(input.clone(), init);
  }

  return nativeFetch(input, init);
}

async function isJwtIssuedAtFutureResponse(response: Response): Promise<boolean> {
  if (response.status !== UNAUTHORIZED_STATUS) {
    return false;
  }

  try {
    const payload = (await response.clone().json()) as PostgrestErrorPayload;
    return (
      payload.code === JWT_CLAIMS_ERROR_CODE &&
      payload.message?.includes(JWT_ISSUED_AT_FUTURE_ERROR_MESSAGE) === true
    );
  } catch {
    return false;
  }
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
