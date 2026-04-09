import { useEffect, useRef, useState } from "react";

import { moveCategoryItem } from "../lib/categoryOrder";
import { loadCategoryOrder, saveCategoryOrder } from "../lib/categoryOrderStorage";
import type { CategoryDefinition } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

type UseCategoryOrderResult = {
  commitOrderedCategories: (nextCategories: CategoryDefinition[]) => void;
  moveCategory: (fromIndex: number, toIndex: number) => void;
  orderedCategories: CategoryDefinition[];
  replaceOrderedCategories: (nextCategories: CategoryDefinition[]) => void;
  saveCurrentOrder: () => void;
};

export function useCategoryOrder(
  type: LedgerEntryType,
  categories: readonly CategoryDefinition[],
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
    commitOrderedCategories: (nextCategories) => {
      orderedCategoriesRef.current = nextCategories;
      setOrderedCategories(nextCategories);
      saveCategoryOrder(type, nextCategories);
    },
    moveCategory: (fromIndex, toIndex) => {
      setOrderedCategories((currentCategories) =>
        moveCategoryItem(currentCategories, fromIndex, toIndex),
      );
    },
    orderedCategories,
    replaceOrderedCategories: (nextCategories) => {
      orderedCategoriesRef.current = nextCategories;
      setOrderedCategories(nextCategories);
    },
    saveCurrentOrder: () => saveCategoryOrder(type, orderedCategoriesRef.current),
  };
}
