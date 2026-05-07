import { readStoredLanguage } from "./languageStorage";
import type { AppLanguage } from "./types";

const DEFAULT_STATIC_COPY_LANGUAGE: AppLanguage = "ko";

export function resolveStaticCopyLanguage(): AppLanguage {
  return readStoredLanguage() ?? DEFAULT_STATIC_COPY_LANGUAGE;
}

export function selectStaticCopy<T>(copyByLanguage: Record<AppLanguage, T>): T {
  return copyByLanguage[resolveStaticCopyLanguage()];
}
