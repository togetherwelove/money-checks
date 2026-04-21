import { useMemo } from "react";

import { CATEGORY_OPTIONS } from "../constants/categories";
import { useCustomCategories } from "./useCustomCategories";

export function useLedgerCategoryLabels(): string[] {
  const {
    customCategories: expenseCustomCategories,
    hiddenSystemCategoryIds: expenseHiddenSystemCategoryIds,
  } = useCustomCategories("expense");
  const {
    customCategories: incomeCustomCategories,
    hiddenSystemCategoryIds: incomeHiddenSystemCategoryIds,
  } = useCustomCategories("income");

  return useMemo(
    () =>
      [
        ...new Set(
          [
            ...CATEGORY_OPTIONS.expense.filter(
              (category) => !expenseHiddenSystemCategoryIds.includes(category.id),
            ),
            ...CATEGORY_OPTIONS.income.filter(
              (category) => !incomeHiddenSystemCategoryIds.includes(category.id),
            ),
            ...expenseCustomCategories,
            ...incomeCustomCategories,
          ].map((category) => category.label),
        ),
      ],
    [
      expenseCustomCategories,
      expenseHiddenSystemCategoryIds,
      incomeCustomCategories,
      incomeHiddenSystemCategoryIds,
    ],
  );
}
