import { useMemo } from "react";

import { CATEGORY_OPTIONS } from "../constants/categories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import { useCustomCategories } from "./useCustomCategories";

export function useLedgerCategoryIconMap(): Map<string, CategoryIconName> {
  const {
    customCategories: expenseCustomCategories,
    systemCategoryIconOverrides: expenseSystemCategoryIconOverrides,
  } = useCustomCategories("expense");
  const {
    customCategories: incomeCustomCategories,
    systemCategoryIconOverrides: incomeSystemCategoryIconOverrides,
  } = useCustomCategories("income");

  return useMemo(
    () =>
      new Map(
        [
          ...applySystemCategoryIconOverrides(
            CATEGORY_OPTIONS.expense,
            expenseSystemCategoryIconOverrides,
          ),
          ...applySystemCategoryIconOverrides(
            CATEGORY_OPTIONS.income,
            incomeSystemCategoryIconOverrides,
          ),
          ...expenseCustomCategories,
          ...incomeCustomCategories,
        ].map((category) => [category.label, category.iconName]),
      ),
    [
      expenseCustomCategories,
      expenseSystemCategoryIconOverrides,
      incomeCustomCategories,
      incomeSystemCategoryIconOverrides,
    ],
  );
}

function applySystemCategoryIconOverrides(
  categories: readonly CategoryDefinition[],
  iconOverrides: Record<string, CategoryIconName>,
): CategoryDefinition[] {
  return categories.map((category) => ({
    ...category,
    iconName: iconOverrides[category.id] ?? category.iconName,
  }));
}
