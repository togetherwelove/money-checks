import { functionI18nResources } from "./resources.ts";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./types.ts";

const DEFAULT_LOCALE: SupportedLocale = "ko";

type TranslationValues = Record<string, number | string>;

export function resolveSupportedLocale(value: string | null | undefined): SupportedLocale {
  return SUPPORTED_LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}

export function translate(
  locale: string | null | undefined,
  key: string,
  values: TranslationValues = {},
): string {
  const template =
    readResourceValue(functionI18nResources[resolveSupportedLocale(locale)], key) ??
    readResourceValue(functionI18nResources[DEFAULT_LOCALE], key) ??
    key;

  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}

function readResourceValue(resources: Record<string, unknown>, key: string): string | null {
  const value = key.split(".").reduce<unknown>((currentValue, segment) => {
    if (!currentValue || typeof currentValue !== "object") {
      return null;
    }

    return (currentValue as Record<string, unknown>)[segment];
  }, resources);

  return typeof value === "string" ? value : null;
}
