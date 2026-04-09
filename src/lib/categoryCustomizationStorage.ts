import { CATEGORY_CUSTOMIZATION_STORAGE_KEY } from "../constants/categoryCustomizer";
import type { StoredCustomCategory } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import { appStorage } from "./appStorage";

type StoredCategoryCustomization = Partial<
  Record<
    LedgerEntryType,
    {
      customCategories: StoredCustomCategory[];
      orderIds: string[];
    }
  >
>;

export function loadStoredCustomCategories(type: LedgerEntryType): StoredCustomCategory[] {
  return loadStoredCategoryCustomization()[type]?.customCategories ?? [];
}

export function saveStoredCustomCategories(
  type: LedgerEntryType,
  customCategories: StoredCustomCategory[],
): void {
  const currentValue = loadStoredCategoryCustomization();
  currentValue[type] = {
    customCategories,
    orderIds: currentValue[type]?.orderIds ?? [],
  };
  appStorage.setItem(CATEGORY_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(currentValue));
}

export function loadStoredCategoryOrderIds(type: LedgerEntryType): string[] {
  return loadStoredCategoryCustomization()[type]?.orderIds ?? [];
}

export function saveStoredCategoryOrderIds(type: LedgerEntryType, orderIds: string[]): void {
  const currentValue = loadStoredCategoryCustomization();
  currentValue[type] = {
    customCategories: currentValue[type]?.customCategories ?? [],
    orderIds,
  };
  appStorage.setItem(CATEGORY_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(currentValue));
}

function loadStoredCategoryCustomization(): StoredCategoryCustomization {
  const storedValue = appStorage.getItem(CATEGORY_CUSTOMIZATION_STORAGE_KEY);
  if (!storedValue) {
    return {};
  }

  try {
    return JSON.parse(storedValue) as StoredCategoryCustomization;
  } catch {
    return {};
  }
}
