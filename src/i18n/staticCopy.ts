import type { AppLanguage } from "./types";

export const DEFAULT_STATIC_COPY_LANGUAGE: AppLanguage = "ko";

export function resolveStaticCopyLanguage(): AppLanguage {
  return DEFAULT_STATIC_COPY_LANGUAGE;
}

export function selectStaticCopy<T>(copyByLanguage: Record<AppLanguage, T>): T {
  return copyByLanguage[DEFAULT_STATIC_COPY_LANGUAGE];
}
