import { EmailOtpTiming } from "../../constants/emailOtp";

export function createEmailOtpCooldownKey(email: string): string {
  return email.trim().toLowerCase();
}

export function calculateEmailOtpResendAvailableAt(nowMs: number): number {
  return nowMs + EmailOtpTiming.resendCooldownMs;
}

export function calculateRemainingEmailOtpCooldownSeconds(
  resendAvailableAt: number | null,
  nowMs: number,
): number {
  if (!resendAvailableAt || resendAvailableAt <= nowMs) {
    return 0;
  }

  return Math.ceil((resendAvailableAt - nowMs) / 1000);
}

export function formatEmailOtpCooldownLabel(remainingSeconds: number): string {
  const safeSeconds = Math.max(remainingSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
