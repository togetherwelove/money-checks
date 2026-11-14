import { AppScheme } from "./appScheme";

export const AppLinks = {
  homepageUrl: "https://cafe.naver.com/alttlemoneybook",
  legacyPasswordResetUrl: `${AppScheme}://password-reset`,
  passwordResetUrl: "https://money-checks-password-reset.expo.app/password-reset",
} as const;
