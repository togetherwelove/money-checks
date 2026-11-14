export const GuestCopy = {
  login: "로그인 / 가입",
  closeAuth: "메인으로 돌아가기",
  entryHint: "기록을 시작하려면 로그인해 주세요.",
  accountHint: "로그인하면 내 가계부를 확인할 수 있어요.",
} as const;

export const GuestEntryConfig = {
  storageKey: "guest-entry-request",
  maxAgeMs: 30 * 60 * 1000,
} as const;
