import { selectStaticCopy } from "../i18n/staticCopy";

export const AuthLandingCopy = selectStaticCopy({
  en: {
    backToMethodsAction: "Use another sign-in method",
    emailSignInAction: "Sign in with Email",
    emailSignUpAction: "Create Account with Email",
    methodDividerLabel: "or",
  },
  ko: {
    backToMethodsAction: "다른 방법으로 로그인",
    emailSignInAction: "이메일로 로그인",
    emailSignUpAction: "이메일로 가입하기",
    methodDividerLabel: "혹은",
  },
} as const);

export const AuthLandingUi = {
  methodDividerGap: 10,
  methodDividerLineHeight: 1,
  methodDividerPaddingVertical: 2,
  methodDividerTextFontSize: 12,
} as const;
