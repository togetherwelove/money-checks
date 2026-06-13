import { useEffect, useRef, useState } from "react";

import {
  CATEGORY_ORDER_SAVE_DEBOUNCE_MS,
  CATEGORY_SHARED_REFRESH_DEBOUNCE_MS,
} from "../constants/categorySelector";
import {
  loadStoredCategoryOrderIds,
  loadStoredCustomCategories,
  loadStoredHiddenSystemCategoryIds,
  loadStoredSystemCategoryIconOverrides,
  loadStoredSystemCategoryLabelOverrides,
  saveStoredCategoryOrderIds,
  saveStoredCustomCategories,
  saveStoredHiddenSystemCategoryIds,
  saveStoredSystemCategoryIconOverrides,
  saveStoredSystemCategoryLabelOverrides,
} from "../lib/categoryCustomizationStorage";
import { mapStoredCustomCategories, toStoredCustomCategories } from "../lib/customCategories";
import {
  fetchLedgerBookCategoryCustomization,
  logLedgerBookCategorySyncError,
  replaceLedgerBookCustomCategories,
  replaceLedgerBookSystemCategoryCustomizations,
  subscribeToLedgerBookCategoryChanges,
} from "../lib/ledgerBookCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

type UseCustomCategoriesResult = {
  categoryOrderIds: string[];
  customCategories: CategoryDefinition[];
  hiddenSystemCategoryIds: string[];
  systemCategoryIconOverrides: Record<string, CategoryIconName>;
  systemCategoryLabelOverrides: Record<string, string>;
  saveCategoryOrderIds: (nextCategoryOrderIds: string[]) => void;
  saveCustomCategories: (nextCategories: CategoryDefinition[]) => void;
  saveHiddenSystemCategoryIds: (nextHiddenSystemCategoryIds: string[]) => void;
  saveSystemCategoryCustomizations: (nextCustomization: {
    hiddenSystemCategoryIds: string[];
    systemCategoryIconOverrides: Record<string, CategoryIconName>;
    systemCategoryLabelOverrides: Record<string, string>;
  }) => void;
};

export function useCustomCategories(
  type: LedgerEntryType,
  bookId?: string | null,
): UseCustomCategoriesResult {
  const storageScope = bookId ? `book.${bookId}` : null;
  const [categoryOrderIds, setCategoryOrderIds] = useState(() =>
    loadStoredCategoryOrderIds(type, storageScope),
  );
  const [customCategories, setCustomCategories] = useState(() =>
    mapStoredCustomCategories(type, loadStoredCustomCategories(type, storageScope)),
  );
  const [hiddenSystemCategoryIds, setHiddenSystemCategoryIds] = useState(() =>
    loadStoredHiddenSystemCategoryIds(type, storageScope),
  );
  const [systemCategoryIconOverrides, setSystemCategoryIconOverrides] = useState(() =>
    loadStoredSystemCategoryIconOverrides(type, storageScope),
  );
  const [systemCategoryLabelOverrides, setSystemCategoryLabelOverrides] = useState(() =>
    loadStoredSystemCategoryLabelOverrides(type, storageScope),
  );
  const categoryOrderSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCategoryOrderIdsRef = useRef(categoryOrderIds);
  const latestCustomCategoriesRef = useRef(customCategories);
  const latestHiddenSystemCategoryIdsRef = useRef(hiddenSystemCategoryIds);
  const latestSystemCategoryIconOverridesRef = useRef(systemCategoryIconOverrides);
  const latestSystemCategoryLabelOverridesRef = useRef(systemCategoryLabelOverrides);

  useEffect(() => {
    setCustomCategories(
      mapStoredCustomCategories(type, loadStoredCustomCategories(type, storageScope)),
    );
    setCategoryOrderIds(loadStoredCategoryOrderIds(type, storageScope));
    setHiddenSystemCategoryIds(loadStoredHiddenSystemCategoryIds(type, storageScope));
    setSystemCategoryIconOverrides(loadStoredSystemCategoryIconOverrides(type, storageScope));
    setSystemCategoryLabelOverrides(loadStoredSystemCategoryLabelOverrides(type, storageScope));
  }, [storageScope, type]);

  useEffect(() => {
    latestCategoryOrderIdsRef.current = categoryOrderIds;
  }, [categoryOrderIds]);

  useEffect(() => {
    latestCustomCategoriesRef.current = customCategories;
  }, [customCategories]);

  useEffect(() => {
    latestHiddenSystemCategoryIdsRef.current = hiddenSystemCategoryIds;
  }, [hiddenSystemCategoryIds]);

  useEffect(() => {
    latestSystemCategoryIconOverridesRef.current = systemCategoryIconOverrides;
  }, [systemCategoryIconOverrides]);

  useEffect(() => {
    latestSystemCategoryLabelOverridesRef.current = systemCategoryLabelOverrides;
  }, [systemCategoryLabelOverrides]);

  useEffect(() => {
    return () => {
      clearCategoryOrderSaveTimer();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let sharedRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    if (!bookId) {
      return () => {
        isMounted = false;
      };
    }

    const loadSharedCategories = async () => {
      try {
        const nextCustomization = await fetchLedgerBookCategoryCustomization(bookId, type);
        if (!isMounted) {
          return;
        }

        setCategoryOrderIds(nextCustomization.categoryOrderIds);
        setCustomCategories(nextCustomization.customCategories);
        setHiddenSystemCategoryIds(nextCustomization.hiddenSystemCategoryIds);
        setSystemCategoryIconOverrides(nextCustomization.systemCategoryIconOverrides);
        setSystemCategoryLabelOverrides(nextCustomization.systemCategoryLabelOverrides);
        saveStoredCategoryOrderIds(type, nextCustomization.categoryOrderIds, storageScope);
        saveStoredCustomCategories(
          type,
          toStoredCustomCategories(nextCustomization.customCategories),
          storageScope,
        );
        saveStoredHiddenSystemCategoryIds(
          type,
          nextCustomization.hiddenSystemCategoryIds,
          storageScope,
        );
        saveStoredSystemCategoryIconOverrides(
          type,
          nextCustomization.systemCategoryIconOverrides,
          storageScope,
        );
        saveStoredSystemCategoryLabelOverrides(
          type,
          nextCustomization.systemCategoryLabelOverrides,
          storageScope,
        );
      } catch (error) {
        logLedgerBookCategorySyncError(error, {
          bookId,
          step: "load_shared_categories",
          type,
        });
      }
    };

    const clearSharedRefreshTimer = () => {
      if (!sharedRefreshTimer) {
        return;
      }

      clearTimeout(sharedRefreshTimer);
      sharedRefreshTimer = null;
    };

    const scheduleSharedCategoriesLoad = () => {
      clearSharedRefreshTimer();
      sharedRefreshTimer = setTimeout(() => {
        sharedRefreshTimer = null;
        void loadSharedCategories();
      }, CATEGORY_SHARED_REFRESH_DEBOUNCE_MS);
    };

    void loadSharedCategories();
    const unsubscribe = subscribeToLedgerBookCategoryChanges({
      bookId,
      entryType: type,
      onChange: scheduleSharedCategoriesLoad,
    });

    return () => {
      isMounted = false;
      clearSharedRefreshTimer();
      unsubscribe();
    };
  }, [bookId, storageScope, type]);

  return {
    categoryOrderIds,
    customCategories,
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides,
    systemCategoryLabelOverrides,
    saveCategoryOrderIds: (nextCategoryOrderIds) => {
      setCategoryOrderIds(nextCategoryOrderIds);
      saveStoredCategoryOrderIds(type, nextCategoryOrderIds, storageScope);
      latestCategoryOrderIdsRef.current = nextCategoryOrderIds;
      if (!bookId) {
        return;
      }

      scheduleCategoryOrderSave();
    },
    saveCustomCategories: (nextCategories) => {
      setCustomCategories(nextCategories);
      latestCustomCategoriesRef.current = nextCategories;
      const nextStoredCategories = toStoredCustomCategories(nextCategories);
      saveStoredCustomCategories(type, nextStoredCategories, storageScope);
      if (bookId) {
        void replaceLedgerBookCustomCategories(
          bookId,
          type,
          nextStoredCategories,
          categoryOrderIds,
        ).catch((error) => {
          logLedgerBookCategorySyncError(error, {
            bookId,
            step: "save_shared_custom_categories",
            type,
          });
        });
      }
    },
    saveHiddenSystemCategoryIds: (nextHiddenSystemCategoryIds) => {
      setHiddenSystemCategoryIds(nextHiddenSystemCategoryIds);
      latestHiddenSystemCategoryIdsRef.current = nextHiddenSystemCategoryIds;
      saveStoredHiddenSystemCategoryIds(type, nextHiddenSystemCategoryIds, storageScope);
      if (bookId) {
        void saveSharedSystemCategoryCustomizations({
          nextCategoryOrderIds: categoryOrderIds,
          nextHiddenSystemCategoryIds,
          nextSystemCategoryIconOverrides: systemCategoryIconOverrides,
          nextSystemCategoryLabelOverrides: systemCategoryLabelOverrides,
          step: "save_shared_hidden_system_categories",
        });
      }
    },
    saveSystemCategoryCustomizations: (nextCustomization) => {
      setHiddenSystemCategoryIds(nextCustomization.hiddenSystemCategoryIds);
      setSystemCategoryIconOverrides(nextCustomization.systemCategoryIconOverrides);
      setSystemCategoryLabelOverrides(nextCustomization.systemCategoryLabelOverrides);
      latestHiddenSystemCategoryIdsRef.current = nextCustomization.hiddenSystemCategoryIds;
      latestSystemCategoryIconOverridesRef.current = nextCustomization.systemCategoryIconOverrides;
      latestSystemCategoryLabelOverridesRef.current =
        nextCustomization.systemCategoryLabelOverrides;
      saveStoredHiddenSystemCategoryIds(
        type,
        nextCustomization.hiddenSystemCategoryIds,
        storageScope,
      );
      saveStoredSystemCategoryIconOverrides(
        type,
        nextCustomization.systemCategoryIconOverrides,
        storageScope,
      );
      saveStoredSystemCategoryLabelOverrides(
        type,
        nextCustomization.systemCategoryLabelOverrides,
        storageScope,
      );
      if (bookId) {
        void saveSharedSystemCategoryCustomizations({
          nextCategoryOrderIds: categoryOrderIds,
          nextHiddenSystemCategoryIds: nextCustomization.hiddenSystemCategoryIds,
          nextSystemCategoryIconOverrides: nextCustomization.systemCategoryIconOverrides,
          nextSystemCategoryLabelOverrides: nextCustomization.systemCategoryLabelOverrides,
          step: "save_shared_system_category_customizations",
        });
      }
    },
  };

  async function saveSharedSystemCategoryCustomizations(params: {
    nextCategoryOrderIds: readonly string[];
    nextHiddenSystemCategoryIds: readonly string[];
    nextSystemCategoryIconOverrides: Record<string, CategoryIconName>;
    nextSystemCategoryLabelOverrides: Record<string, string>;
    step: string;
  }) {
    if (!bookId) {
      return;
    }

    try {
      await replaceLedgerBookSystemCategoryCustomizations(bookId, type, {
        categoryOrderIds: params.nextCategoryOrderIds,
        hiddenSystemCategoryIds: params.nextHiddenSystemCategoryIds,
        systemCategoryIconOverrides: params.nextSystemCategoryIconOverrides,
        systemCategoryLabelOverrides: params.nextSystemCategoryLabelOverrides,
      });
    } catch (error) {
      logLedgerBookCategorySyncError(error, {
        bookId,
        step: params.step,
        type,
      });
    }
  }

  function scheduleCategoryOrderSave() {
    clearCategoryOrderSaveTimer();
    categoryOrderSaveTimerRef.current = setTimeout(() => {
      categoryOrderSaveTimerRef.current = null;
      void saveSharedCategoryOrder();
    }, CATEGORY_ORDER_SAVE_DEBOUNCE_MS);
  }

  function clearCategoryOrderSaveTimer() {
    if (!categoryOrderSaveTimerRef.current) {
      return;
    }

    clearTimeout(categoryOrderSaveTimerRef.current);
    categoryOrderSaveTimerRef.current = null;
  }

  async function saveSharedCategoryOrder() {
    if (!bookId) {
      return;
    }

    const nextCategoryOrderIds = latestCategoryOrderIdsRef.current;
    const nextStoredCategories = toStoredCustomCategories(latestCustomCategoriesRef.current);
    try {
      await replaceLedgerBookCustomCategories(
        bookId,
        type,
        nextStoredCategories,
        nextCategoryOrderIds,
      );
    } catch (error) {
      logLedgerBookCategorySyncError(error, {
        bookId,
        step: "save_shared_custom_category_order",
        type,
      });
    }

    await saveSharedSystemCategoryCustomizations({
      nextCategoryOrderIds,
      nextHiddenSystemCategoryIds: latestHiddenSystemCategoryIdsRef.current,
      nextSystemCategoryIconOverrides: latestSystemCategoryIconOverridesRef.current,
      nextSystemCategoryLabelOverrides: latestSystemCategoryLabelOverridesRef.current,
      step: "save_shared_system_category_order",
    });
  }
}
