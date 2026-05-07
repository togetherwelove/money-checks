import { useMemo } from "react";

import { useLedgerCategories } from "./useLedgerCategories";

export function useLedgerCategoryLabels(): string[] {
  const categories = useLedgerCategories();

  return useMemo(() => [...new Set(categories.map((category) => category.label))], [categories]);
}
