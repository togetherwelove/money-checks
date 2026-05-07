import { useMemo } from "react";

import { CATEGORY_OPTIONS } from "../constants/categories";
import { mergeCustomCategories } from "../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import { useCustomCategories } from "./useCustomCategories";

export function useLedgerCategories(): CategoryDefinition[] {
  const {
    customCategories: expenseCustomCategories,
    hiddenSystemCategoryIds: expenseHiddenSystemCategoryIds,
    systemCategoryIconOverrides: expenseSystemCategoryIconOverrides,
  } = useCustomCategories("expense");
  const {
    customCategories: incomeCustomCategories,
    hiddenSystemCategoryIds: incomeHiddenSystemCategoryIds,
    systemCategoryIconOverrides: incomeSystemCategoryIconOverrides,
  } = useCustomCategories("income");

  return useMemo(
    () => [
      ...mergeCustomCategories(
        applyVisibleSystemCategories(
          CATEGORY_OPTIONS.expense,
          expenseHiddenSystemCategoryIds,
          expenseSystemCategoryIconOverrides,
        ),
        expenseCustomCategories,
      ),
      ...mergeCustomCategories(
        applyVisibleSystemCategories(
          CATEGORY_OPTIONS.income,
          incomeHiddenSystemCategoryIds,
          incomeSystemCategoryIconOverrides,
        ),
        incomeCustomCategories,
      ),
    ],
    [
      expenseCustomCategories,
      expenseHiddenSystemCategoryIds,
      expenseSystemCategoryIconOverrides,
      incomeCustomCategories,
      incomeHiddenSystemCategoryIds,
      incomeSystemCategoryIconOverrides,
    ],
  );
}

function applyVisibleSystemCategories(
  categories: readonly CategoryDefinition[],
  hiddenCategoryIds: readonly string[],
  iconOverrides: Record<string, CategoryIconName>,
): CategoryDefinition[] {
  return categories
    .filter((category) => !hiddenCategoryIds.includes(category.id))
    .map((category) => ({
      ...category,
      iconName: iconOverrides[category.id] ?? category.iconName,
    }));
}
