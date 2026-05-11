import { selectStaticCopy } from "../i18n/staticCopy";
import { isApplePrivateRelayEmail } from "../lib/auth/applePrivateRelayEmail";

export const AuthOnboardingMessages = selectStaticCopy({
  en: {
    nicknameAccountDescriptionPrefix: "Setting up ",
    nicknameAccountPrivateRelayDescriptionPrefix: "Setting up Apple private email ",
    nicknameAccountDescriptionSuffix: " account.",
    nicknameEyebrow: "Welcome",
    nicknameError: "Could not save your name. Please try again.",
    nicknamePlaceholder: "Name to use",
    nicknamePrimaryAction: "Next",
    nicknameSwitchAccountAction: "Use a different account",
    nicknameSwitchAccountConfirmMessage:
      "You will be signed out and returned to the sign-in screen.",
    nicknameSwitchAccountConfirmTitle: "Use a different account?",
    nicknameSwitchAccountError: "Could not sign out. Please try again.",
    nicknameTitle: "Set your name.",
  },
  ko: {
    nicknameAccountDescriptionPrefix: "현재 ",
    nicknameAccountPrivateRelayDescriptionPrefix: "현재 Apple 비공개 이메일 ",
    nicknameAccountDescriptionSuffix: " 계정으로 설정 중",
    nicknameEyebrow: "반갑습니다",
    nicknameError: "이름을 저장하지 못했어요. 다시 시도해 주세요.",
    nicknamePlaceholder: "사용할 이름",
    nicknamePrimaryAction: "다음",
    nicknameSwitchAccountAction: "다른 계정으로 로그인",
    nicknameSwitchAccountConfirmMessage: "로그아웃 후 로그인 화면으로 이동합니다.",
    nicknameSwitchAccountConfirmTitle: "다른 계정으로 로그인할까요?",
    nicknameSwitchAccountError: "로그아웃하지 못했어요. 다시 시도해 주세요.",
    nicknameTitle: "이름을 설정해 주세요.",
  },
} as const);

export function buildNicknameAccountDescription(accountEmail: string): string {
  const prefix = isApplePrivateRelayEmail(accountEmail)
    ? AuthOnboardingMessages.nicknameAccountPrivateRelayDescriptionPrefix
    : AuthOnboardingMessages.nicknameAccountDescriptionPrefix;

  return `${prefix}${accountEmail}${AuthOnboardingMessages.nicknameAccountDescriptionSuffix}`;
}

export const AuthOnboardingTiming = {
  nicknameTransitionDelayMs: 220,
  permissionRequestDelayMs: 700,
} as const;
