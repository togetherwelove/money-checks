import { selectStaticCopy } from "../i18n/staticCopy";

export const AuthOnboardingMessages = selectStaticCopy({
  en: {
    nicknameEyebrow: "Welcome",
    nicknameError: "Could not save your name. Please try again.",
    nicknamePlaceholder: "Name to use",
    nicknamePrimaryAction: "Next",
    nicknameTitle: "Set your name.",
  },
  ko: {
    nicknameEyebrow: "반갑습니다",
    nicknameError: "이름을 저장하지 못했어요. 다시 시도해 주세요.",
    nicknamePlaceholder: "사용할 이름",
    nicknamePrimaryAction: "다음",
    nicknameTitle: "이름을 설정해 주세요.",
  },
} as const);

export const AuthOnboardingTiming = {
  nicknameTransitionDelayMs: 220,
  permissionRequestDelayMs: 700,
} as const;
