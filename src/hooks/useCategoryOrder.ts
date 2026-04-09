import { useEffect, useRef, useState } from "react";

import { moveCategoryItem } from "../lib/categoryOrder";
import { loadCategoryOrder, saveCategoryOrder } from "../lib/categoryOrderStorage";
import type { LedgerEntryType } from "../types/ledger";

type UseCategoryOrderResult = {
  moveCategory: (fromIndex: number, toIndex: number) => void;
  orderedCategories: string[];
  saveCurrentOrder: () => void;
};

export function useCategoryOrder(
  type: LedgerEntryType,
  categories: readonly string[],
): UseCategoryOrderResult {
  const [orderedCategories, setOrderedCategories] = useState(() =>
    loadCategoryOrder(type, categories),
  );
  const orderedCategoriesRef = useRef(orderedCategories);

  useEffect(() => {
    const nextCategories = loadCategoryOrder(type, categories);
    orderedCategoriesRef.current = nextCategories;
    setOrderedCategories(nextCategories);
  }, [categories, type]);

  useEffect(() => {
    orderedCategoriesRef.current = orderedCategories;
  }, [orderedCategories]);

  return {
    moveCategory: (fromIndex, toIndex) => {
      setOrderedCategories((currentCategories) =>
        moveCategoryItem(currentCategories, fromIndex, toIndex),
      );
    },
    orderedCategories,
    saveCurrentOrder: () => saveCategoryOrder(type, orderedCategoriesRef.current),
  };
}
