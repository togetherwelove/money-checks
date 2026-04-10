import { useEffect, useState } from "react";

import {
  loadStoredCustomCategories,
  loadStoredHiddenSystemCategoryIds,
  saveStoredCustomCategories,
  saveStoredHiddenSystemCategoryIds,
} from "../lib/categoryCustomizationStorage";
import { mapStoredCustomCategories, toStoredCustomCategories } from "../lib/customCategories";
import type { CategoryDefinition } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

type UseCustomCategoriesResult = {
  customCategories: CategoryDefinition[];
  hiddenSystemCategoryIds: string[];
  saveCustomCategories: (nextCategories: CategoryDefinition[]) => void;
  saveHiddenSystemCategoryIds: (nextCategoryIds: string[]) => void;
};

export function useCustomCategories(type: LedgerEntryType): UseCustomCategoriesResult {
  const [customCategories, setCustomCategories] = useState(() =>
    mapStoredCustomCategories(type, loadStoredCustomCategories(type)),
  );
  const [hiddenSystemCategoryIds, setHiddenSystemCategoryIds] = useState(() =>
    loadStoredHiddenSystemCategoryIds(type),
  );

  useEffect(() => {
    setCustomCategories(mapStoredCustomCategories(type, loadStoredCustomCategories(type)));
    setHiddenSystemCategoryIds(loadStoredHiddenSystemCategoryIds(type));
  }, [type]);

  return {
    customCategories,
    hiddenSystemCategoryIds,
    saveCustomCategories: (nextCategories) => {
      setCustomCategories(nextCategories);
      saveStoredCustomCategories(type, toStoredCustomCategories(nextCategories));
    },
    saveHiddenSystemCategoryIds: (nextCategoryIds) => {
      setHiddenSystemCategoryIds(nextCategoryIds);
      saveStoredHiddenSystemCategoryIds(type, nextCategoryIds);
    },
  };
}
