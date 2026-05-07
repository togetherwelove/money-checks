export const AppLanguages = ["ko", "en"] as const;

export type AppLanguage = (typeof AppLanguages)[number];
