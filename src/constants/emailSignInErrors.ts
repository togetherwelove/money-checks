import { selectStaticCopy } from "../i18n/staticCopy";

export const EmailSignInErrorCopy = selectStaticCopy({
  en: {
    emailNotConfirmed: "Email verification is not complete. Check your sign-up email first.",
  },
  ko: {
    emailNotConfirmed:
      "이메일 인증이 아직 완료되지 않았어요. 가입 메일의 인증을 먼저 완료해 주세요.",
  },
});
