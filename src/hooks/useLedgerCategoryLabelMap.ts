import { useMemo } from "react";

import { useLedgerCategories } from "./useLedgerCategories";

export function useLedgerCategoryLabelMap(bookId?: string | null): Map<string, string> {
  const categories = useLedgerCategories(bookId);

  return useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
}
