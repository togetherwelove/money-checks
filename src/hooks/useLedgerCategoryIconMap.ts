import { useMemo } from "react";

import { EXPENSE_CATEGORY_LABEL_COPY } from "../constants/expenseCategories";
import { INCOME_CATEGORY_LABEL_COPY } from "../constants/incomeCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import { useLedgerCategories } from "./useLedgerCategories";

type CategoryLabelCopy = Record<string, Record<string, string>>;

export function useLedgerCategoryIconMap(bookId?: string | null): Map<string, CategoryIconName> {
  const categories = useLedgerCategories(bookId);

  return useMemo(() => {
    const iconByKey = new Map<string, CategoryIconName>();

    for (const category of categories) {
      iconByKey.set(category.id, category.iconName);
      iconByKey.set(category.label, category.iconName);
    }

    addSystemCategoryLabelAliases(iconByKey, categories, EXPENSE_CATEGORY_LABEL_COPY);
    addSystemCategoryLabelAliases(iconByKey, categories, INCOME_CATEGORY_LABEL_COPY);

    return iconByKey;
  }, [categories]);
}

function addSystemCategoryLabelAliases(
  iconByKey: Map<string, CategoryIconName>,
  categories: readonly CategoryDefinition[],
  labelCopy: CategoryLabelCopy,
): void {
  for (const category of categories) {
    const labelsByLanguage = Object.values(labelCopy).find((languageLabels) =>
      Object.values(languageLabels).includes(category.label),
    );

    if (!labelsByLanguage) {
      continue;
    }

    for (const label of Object.values(labelsByLanguage)) {
      if (iconByKey.has(label)) {
        continue;
      }

      iconByKey.set(label, category.iconName);
    }
  }
}
