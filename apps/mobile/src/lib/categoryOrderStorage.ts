import type { LedgerEntryType } from "../types/ledger";
import { appStorage } from "./appStorage";
import { resolveCategoryOrder } from "./categoryOrder";

const CATEGORY_ORDER_STORAGE_KEY = "moneychecks.category-order.v1";

type StoredCategoryOrder = Partial<Record<LedgerEntryType, string[]>>;

export function loadCategoryOrder(type: LedgerEntryType, categories: readonly string[]): string[] {
  const storedValue = appStorage.getItem(CATEGORY_ORDER_STORAGE_KEY);
  if (!storedValue) {
    return [...categories];
  }

  try {
    const parsedValue = JSON.parse(storedValue) as StoredCategoryOrder;
    return resolveCategoryOrder(categories, parsedValue[type]);
  } catch {
    return [...categories];
  }
}

export function saveCategoryOrder(type: LedgerEntryType, categories: readonly string[]): void {
  const currentValue = loadStoredCategoryOrder();
  currentValue[type] = [...categories];
  appStorage.setItem(CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(currentValue));
}

function loadStoredCategoryOrder(): StoredCategoryOrder {
  const storedValue = appStorage.getItem(CATEGORY_ORDER_STORAGE_KEY);
  if (!storedValue) {
    return {};
  }

  try {
    return JSON.parse(storedValue) as StoredCategoryOrder;
  } catch {
    return {};
  }
}
