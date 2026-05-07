import { selectStaticCopy } from "../i18n/staticCopy";

export const NavigationCopy = selectStaticCopy({
  en: {
    backActionAccessibilityLabel: "Back",
  },
  ko: {
    backActionAccessibilityLabel: "뒤로",
  },
} as const);
