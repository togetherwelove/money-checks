import { selectStaticCopy } from "../i18n/staticCopy";

export const AuthCaptchaConfig = {
  hcaptchaBaseUrl: "https://hcaptcha.com",
  hcaptchaSiteKey: process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY ?? "",
} as const;

export const AuthCaptchaMessages = selectStaticCopy({
  en: {
    configMissing: "CAPTCHA is not configured. Check the app settings.",
    verificationFailed: "CAPTCHA verification failed. Please try again.",
  },
  ko: {
    configMissing: "CAPTCHA 설정이 필요해요. 앱 설정을 확인해 주세요.",
    verificationFailed: "CAPTCHA 인증에 실패했어요. 다시 시도해 주세요.",
  },
} as const);

export const AuthCaptchaEvents = {
  challengeClosed: "challenge-closed",
  challengeExpired: "challenge-expired",
  open: "open",
} as const;
