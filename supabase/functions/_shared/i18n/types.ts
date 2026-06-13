export const SUPPORTED_LOCALES = ["ko"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
