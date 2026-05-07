export const SUPPORTED_LOCALES = ["ko", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
