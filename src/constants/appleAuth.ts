import { selectStaticCopy } from "../i18n/staticCopy";

export const AppleAuthCopy = selectStaticCopy({
  en: {
    signInAction: "Sign in with Apple",
    cancelledError: "Apple sign-in was canceled.",
    missingTokenError: "Could not get the Apple sign-in token.",
    signInError: "Could not sign in with Apple. Please try again.",
    unavailableError: "Apple sign-in is unavailable in this environment.",
  },
  ko: {
    signInAction: "Apple로 로그인",
    cancelledError: "Apple 로그인이 취소되었어요.",
    missingTokenError: "Apple 로그인 토큰을 가져오지 못했어요.",
    signInError: "Apple로 로그인하지 못했어요. 다시 시도해 주세요.",
    unavailableError: "Apple 로그인을 사용할 수 없는 환경이에요.",
  },
} as const);

export const AppleAuthConfig = {
  defaultDisplayName: selectStaticCopy({
    en: "User",
    ko: "사용자",
  }),
} as const;
