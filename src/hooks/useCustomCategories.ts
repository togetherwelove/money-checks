import { useEffect, useState } from "react";

import {
  loadStoredCustomCategories,
  saveStoredCustomCategories,
} from "../lib/categoryCustomizationStorage";
import { mapStoredCustomCategories, toStoredCustomCategories } from "../lib/customCategories";
import type { CategoryDefinition } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

type UseCustomCategoriesResult = {
  customCategories: CategoryDefinition[];
  saveCustomCategories: (nextCategories: CategoryDefinition[]) => void;
};

export function useCustomCategories(type: LedgerEntryType): UseCustomCategoriesResult {
  const [customCategories, setCustomCategories] = useState(() =>
    mapStoredCustomCategories(type, loadStoredCustomCategories(type)),
  );

  useEffect(() => {
    setCustomCategories(mapStoredCustomCategories(type, loadStoredCustomCategories(type)));
  }, [type]);

  return {
    customCategories,
    saveCustomCategories: (nextCategories) => {
      setCustomCategories(nextCategories);
      saveStoredCustomCategories(type, toStoredCustomCategories(nextCategories));
    },
  };
}
