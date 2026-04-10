import { AuthTiming } from "./authTiming";

export const AuthRateLimit = {
  defaultRetrySeconds: AuthTiming.signUpOtpResendCooldownMs / 1000,
  signUpCooldownMessage: "보안을 위해 가입 요청은 잠시 후 다시 시도할 수 있습니다.",
} as const;
