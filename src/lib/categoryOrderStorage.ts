import type { CategoryDefinition } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import {
  loadStoredCategoryOrderIds,
  saveStoredCategoryOrderIds,
} from "./categoryCustomizationStorage";
import { resolveCategoryOrder } from "./categoryOrder";

export function loadCategoryOrder(
  type: LedgerEntryType,
  categories: readonly CategoryDefinition[],
): CategoryDefinition[] {
  return resolveCategoryOrder(categories, loadStoredCategoryOrderIds(type));
}

export function saveCategoryOrder(
  type: LedgerEntryType,
  categories: readonly CategoryDefinition[],
): void {
  saveStoredCategoryOrderIds(
    type,
    categories.map((category) => category.id),
  );
}
