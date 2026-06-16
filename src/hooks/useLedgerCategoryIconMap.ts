import { useMemo } from "react";

import type { CategoryDefinition, CategoryIconName } from "../types/category";
import { useLedgerCategories } from "./useLedgerCategories";

export function useLedgerCategoryIconMap(bookId?: string | null): Map<string, CategoryIconName> {
  const categories = useLedgerCategories(bookId);

  return useMemo(() => {
    const iconByKey = new Map<string, CategoryIconName>();

    for (const category of categories) {
      iconByKey.set(category.id, category.iconName);
      iconByKey.set(category.label, category.iconName);
    }

    return iconByKey;
  }, [categories]);
}
