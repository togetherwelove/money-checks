import { selectStaticCopy } from "../i18n/staticCopy";

export const GoogleAuthCopy = selectStaticCopy({
  en: {
    dividerLabel: "or",
    signInAction: "Sign in with Google",
    cancelledError: "Google sign-in was canceled.",
    missingSessionError: "Could not get the Google sign-in session.",
    unavailableError: "Google sign-in is unavailable in this environment.",
  },
  ko: {
    dividerLabel: "또는",
    signInAction: "Google로 로그인",
    cancelledError: "Google 로그인이 취소되었어요.",
    missingSessionError: "Google 로그인 세션을 가져오지 못했어요.",
    unavailableError: "Google 로그인을 사용할 수 없는 환경이에요.",
  },
} as const);
