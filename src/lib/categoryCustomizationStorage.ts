import { CATEGORY_CUSTOMIZATION_STORAGE_KEY } from "../constants/categoryCustomizer";
import type { CategoryIconName } from "../types/category";
import type { StoredCustomCategory } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import { appStorage } from "./appStorage";

type StoredCategoryCustomization = Partial<
  Record<
    LedgerEntryType,
    {
      categoryOrderIds: string[];
      customCategories: StoredCustomCategory[];
      hiddenSystemCategoryIds: string[];
      systemCategoryIconOverrides: Record<string, CategoryIconName>;
      systemCategoryLabelOverrides: Record<string, string>;
    }
  >
>;

export function loadStoredCustomCategories(
  type: LedgerEntryType,
  storageScope?: string | null,
): StoredCustomCategory[] {
  return loadStoredCategoryCustomization(storageScope)[type]?.customCategories ?? [];
}

export function loadStoredCategoryOrderIds(
  type: LedgerEntryType,
  storageScope?: string | null,
): string[] {
  return loadStoredCategoryCustomization(storageScope)[type]?.categoryOrderIds ?? [];
}

export function saveStoredCustomCategories(
  type: LedgerEntryType,
  customCategories: StoredCustomCategory[],
  storageScope?: string | null,
): void {
  const currentValue = loadStoredCategoryCustomization(storageScope);
  currentValue[type] = {
    categoryOrderIds: currentValue[type]?.categoryOrderIds ?? [],
    customCategories,
    hiddenSystemCategoryIds: currentValue[type]?.hiddenSystemCategoryIds ?? [],
    systemCategoryIconOverrides: currentValue[type]?.systemCategoryIconOverrides ?? {},
    systemCategoryLabelOverrides: currentValue[type]?.systemCategoryLabelOverrides ?? {},
  };
  appStorage.setItem(
    resolveCategoryCustomizationStorageKey(storageScope),
    JSON.stringify(currentValue),
  );
}

export function saveStoredCategoryOrderIds(
  type: LedgerEntryType,
  categoryOrderIds: string[],
  storageScope?: string | null,
): void {
  const currentValue = loadStoredCategoryCustomization(storageScope);
  currentValue[type] = {
    categoryOrderIds,
    customCategories: currentValue[type]?.customCategories ?? [],
    hiddenSystemCategoryIds: currentValue[type]?.hiddenSystemCategoryIds ?? [],
    systemCategoryIconOverrides: currentValue[type]?.systemCategoryIconOverrides ?? {},
    systemCategoryLabelOverrides: currentValue[type]?.systemCategoryLabelOverrides ?? {},
  };
  appStorage.setItem(
    resolveCategoryCustomizationStorageKey(storageScope),
    JSON.stringify(currentValue),
  );
}

export function loadStoredHiddenSystemCategoryIds(
  type: LedgerEntryType,
  storageScope?: string | null,
): string[] {
  return loadStoredCategoryCustomization(storageScope)[type]?.hiddenSystemCategoryIds ?? [];
}

export function saveStoredHiddenSystemCategoryIds(
  type: LedgerEntryType,
  hiddenSystemCategoryIds: string[],
  storageScope?: string | null,
): void {
  const currentValue = loadStoredCategoryCustomization(storageScope);
  currentValue[type] = {
    categoryOrderIds: currentValue[type]?.categoryOrderIds ?? [],
    customCategories: currentValue[type]?.customCategories ?? [],
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides: currentValue[type]?.systemCategoryIconOverrides ?? {},
    systemCategoryLabelOverrides: currentValue[type]?.systemCategoryLabelOverrides ?? {},
  };
  appStorage.setItem(
    resolveCategoryCustomizationStorageKey(storageScope),
    JSON.stringify(currentValue),
  );
}

export function loadStoredSystemCategoryIconOverrides(
  type: LedgerEntryType,
  storageScope?: string | null,
): Record<string, CategoryIconName> {
  return loadStoredCategoryCustomization(storageScope)[type]?.systemCategoryIconOverrides ?? {};
}

export function loadStoredSystemCategoryLabelOverrides(
  type: LedgerEntryType,
  storageScope?: string | null,
): Record<string, string> {
  return loadStoredCategoryCustomization(storageScope)[type]?.systemCategoryLabelOverrides ?? {};
}

export function saveStoredSystemCategoryIconOverrides(
  type: LedgerEntryType,
  systemCategoryIconOverrides: Record<string, CategoryIconName>,
  storageScope?: string | null,
): void {
  const currentValue = loadStoredCategoryCustomization(storageScope);
  currentValue[type] = {
    categoryOrderIds: currentValue[type]?.categoryOrderIds ?? [],
    customCategories: currentValue[type]?.customCategories ?? [],
    hiddenSystemCategoryIds: currentValue[type]?.hiddenSystemCategoryIds ?? [],
    systemCategoryIconOverrides,
    systemCategoryLabelOverrides: currentValue[type]?.systemCategoryLabelOverrides ?? {},
  };
  appStorage.setItem(
    resolveCategoryCustomizationStorageKey(storageScope),
    JSON.stringify(currentValue),
  );
}

export function saveStoredSystemCategoryLabelOverrides(
  type: LedgerEntryType,
  systemCategoryLabelOverrides: Record<string, string>,
  storageScope?: string | null,
): void {
  const currentValue = loadStoredCategoryCustomization(storageScope);
  currentValue[type] = {
    categoryOrderIds: currentValue[type]?.categoryOrderIds ?? [],
    customCategories: currentValue[type]?.customCategories ?? [],
    hiddenSystemCategoryIds: currentValue[type]?.hiddenSystemCategoryIds ?? [],
    systemCategoryIconOverrides: currentValue[type]?.systemCategoryIconOverrides ?? {},
    systemCategoryLabelOverrides,
  };
  appStorage.setItem(
    resolveCategoryCustomizationStorageKey(storageScope),
    JSON.stringify(currentValue),
  );
}

function loadStoredCategoryCustomization(
  storageScope?: string | null,
): StoredCategoryCustomization {
  const storedValue = appStorage.getItem(resolveCategoryCustomizationStorageKey(storageScope));
  if (!storedValue) {
    return {};
  }

  try {
    return JSON.parse(storedValue) as StoredCategoryCustomization;
  } catch {
    return {};
  }
}

function resolveCategoryCustomizationStorageKey(storageScope?: string | null): string {
  return storageScope
    ? `${CATEGORY_CUSTOMIZATION_STORAGE_KEY}.${storageScope}`
    : CATEGORY_CUSTOMIZATION_STORAGE_KEY;
}
