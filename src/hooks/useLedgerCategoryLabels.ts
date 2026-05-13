import { useMemo } from "react";

import { useLedgerCategories } from "./useLedgerCategories";

export function useLedgerCategoryLabels(bookId?: string | null): string[] {
  const categories = useLedgerCategories(bookId);

  return useMemo(() => [...new Set(categories.map((category) => category.label))], [categories]);
}
