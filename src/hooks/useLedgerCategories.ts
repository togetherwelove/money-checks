import { useMemo } from "react";

import { CATEGORY_OPTIONS } from "../constants/categories";
import { mergeCustomCategories, sortCategoriesByOrderIds } from "../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import { useCustomCategories } from "./useCustomCategories";

export function useLedgerCategories(bookId?: string | null): CategoryDefinition[] {
  const {
    categoryOrderIds: expenseCategoryOrderIds,
    customCategories: expenseCustomCategories,
    hiddenSystemCategoryIds: expenseHiddenSystemCategoryIds,
    systemCategoryIconOverrides: expenseSystemCategoryIconOverrides,
    systemCategoryLabelOverrides: expenseSystemCategoryLabelOverrides,
  } = useCustomCategories("expense", bookId);
  const {
    categoryOrderIds: incomeCategoryOrderIds,
    customCategories: incomeCustomCategories,
    hiddenSystemCategoryIds: incomeHiddenSystemCategoryIds,
    systemCategoryIconOverrides: incomeSystemCategoryIconOverrides,
    systemCategoryLabelOverrides: incomeSystemCategoryLabelOverrides,
  } = useCustomCategories("income", bookId);

  return useMemo(
    () => [
      ...sortCategoriesByOrderIds(
        mergeCustomCategories(
          applyVisibleSystemCategories(
            CATEGORY_OPTIONS.expense,
            expenseHiddenSystemCategoryIds,
            expenseSystemCategoryIconOverrides,
            expenseSystemCategoryLabelOverrides,
          ),
          expenseCustomCategories,
        ),
        expenseCategoryOrderIds,
      ),
      ...sortCategoriesByOrderIds(
        mergeCustomCategories(
          applyVisibleSystemCategories(
            CATEGORY_OPTIONS.income,
            incomeHiddenSystemCategoryIds,
            incomeSystemCategoryIconOverrides,
            incomeSystemCategoryLabelOverrides,
          ),
          incomeCustomCategories,
        ),
        incomeCategoryOrderIds,
      ),
    ],
    [
      expenseCategoryOrderIds,
      expenseCustomCategories,
      expenseHiddenSystemCategoryIds,
      expenseSystemCategoryIconOverrides,
      expenseSystemCategoryLabelOverrides,
      incomeCategoryOrderIds,
      incomeCustomCategories,
      incomeHiddenSystemCategoryIds,
      incomeSystemCategoryIconOverrides,
      incomeSystemCategoryLabelOverrides,
    ],
  );
}

function applyVisibleSystemCategories(
  categories: readonly CategoryDefinition[],
  hiddenCategoryIds: readonly string[],
  iconOverrides: Record<string, CategoryIconName>,
  labelOverrides: Record<string, string>,
): CategoryDefinition[] {
  return categories
    .filter((category) => !hiddenCategoryIds.includes(category.id))
    .map((category) => ({
      ...category,
      iconName: iconOverrides[category.id] ?? category.iconName,
      label: labelOverrides[category.id] ?? category.label,
    }));
}
