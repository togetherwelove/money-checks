const SIGN_UP_OTP_RETRY_PATTERN = /after\s+(\d+)\s+seconds/i;
const SIGN_UP_RATE_LIMIT_PATTERN = /rate limit exceeded/i;
export const DEFAULT_SIGN_UP_RETRY_SECONDS = 5 * 60;
export const SIGN_UP_COOLDOWN_MESSAGE = "보안을 위해 가입 요청은 잠시 뒤 다시 시도할 수 있어요.";

export function parseSignUpOtpRetrySeconds(error: unknown): number | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const matchedSeconds = error.message.match(SIGN_UP_OTP_RETRY_PATTERN)?.[1];
  if (!matchedSeconds) {
    return null;
  }

  const seconds = Number.parseInt(matchedSeconds, 10);
  return Number.isFinite(seconds) ? seconds : null;
}

export function resolveSignUpRetrySeconds(error: unknown): number | null {
  const parsedRetrySeconds = parseSignUpOtpRetrySeconds(error);
  if (parsedRetrySeconds !== null) {
    return parsedRetrySeconds;
  }

  if (!(error instanceof Error)) {
    return null;
  }

  return SIGN_UP_RATE_LIMIT_PATTERN.test(error.message) ? DEFAULT_SIGN_UP_RETRY_SECONDS : null;
}

export function formatSignUpOtpCooldownLabel(remainingSeconds: number): string {
  const safeSeconds = Math.max(remainingSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
