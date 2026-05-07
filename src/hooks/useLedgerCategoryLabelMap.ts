import { useMemo } from "react";

import { useLedgerCategories } from "./useLedgerCategories";

export function useLedgerCategoryLabelMap(): Map<string, string> {
  const categories = useLedgerCategories();

  return useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
}
