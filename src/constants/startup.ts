export const StartupCheck = {
  timeoutMs: 10_000,
} as const;

export const StartupCopy = {
  title: "앱을 시작하지 못했어요",
  failed: "초기 정보를 확인하지 못했어요. 네트워크 연결을 확인한 후 다시 시도해 주세요.",
  timedOut: "응답 시간이 초과되었어요. 네트워크 연결을 확인한 후 다시 시도해 주세요.",
  retry: "다시 시도",
} as const;
