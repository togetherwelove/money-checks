import { useEffect, useState } from "react";

import {
  loadStoredCustomCategories,
  loadStoredHiddenSystemCategoryIds,
  loadStoredSystemCategoryIconOverrides,
  saveStoredCustomCategories,
  saveStoredHiddenSystemCategoryIds,
  saveStoredSystemCategoryIconOverrides,
} from "../lib/categoryCustomizationStorage";
import { mapStoredCustomCategories, toStoredCustomCategories } from "../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

type UseCustomCategoriesResult = {
  customCategories: CategoryDefinition[];
  hiddenSystemCategoryIds: string[];
  systemCategoryIconOverrides: Record<string, CategoryIconName>;
  saveCustomCategories: (nextCategories: CategoryDefinition[]) => void;
  saveHiddenSystemCategoryIds: (nextCategoryIds: string[]) => void;
  saveSystemCategoryIconOverrides: (
    nextSystemCategoryIconOverrides: Record<string, CategoryIconName>,
  ) => void;
};

export function useCustomCategories(type: LedgerEntryType): UseCustomCategoriesResult {
  const [customCategories, setCustomCategories] = useState(() =>
    mapStoredCustomCategories(type, loadStoredCustomCategories(type)),
  );
  const [hiddenSystemCategoryIds, setHiddenSystemCategoryIds] = useState(() =>
    loadStoredHiddenSystemCategoryIds(type),
  );
  const [systemCategoryIconOverrides, setSystemCategoryIconOverrides] = useState(() =>
    loadStoredSystemCategoryIconOverrides(type),
  );

  useEffect(() => {
    setCustomCategories(mapStoredCustomCategories(type, loadStoredCustomCategories(type)));
    setHiddenSystemCategoryIds(loadStoredHiddenSystemCategoryIds(type));
    setSystemCategoryIconOverrides(loadStoredSystemCategoryIconOverrides(type));
  }, [type]);

  return {
    customCategories,
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides,
    saveCustomCategories: (nextCategories) => {
      setCustomCategories(nextCategories);
      saveStoredCustomCategories(type, toStoredCustomCategories(nextCategories));
    },
    saveHiddenSystemCategoryIds: (nextCategoryIds) => {
      setHiddenSystemCategoryIds(nextCategoryIds);
      saveStoredHiddenSystemCategoryIds(type, nextCategoryIds);
    },
    saveSystemCategoryIconOverrides: (nextSystemCategoryIconOverrides) => {
      setSystemCategoryIconOverrides(nextSystemCategoryIconOverrides);
      saveStoredSystemCategoryIconOverrides(type, nextSystemCategoryIconOverrides);
    },
  };
}
