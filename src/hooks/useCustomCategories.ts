import { useEffect, useMemo, useRef, useState } from "react";
import { CategorySaveSession } from "../lib/categorySaveSession";

import {
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
  saveCategoryOrderIds: (nextCategoryOrderIds: string[]) => Promise<boolean>;
  isLoadingCategories: boolean;
  isSavingCategories: boolean;
  saveCustomCategories: (nextCategories: CategoryDefinition[]) => Promise<boolean>;
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
  const session = useMemo(() => new CategorySaveSession(), [storageScope, type]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(Boolean(bookId));
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [reloadRevision, setReloadRevision] = useState(0);
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
  const latestCategoryOrderIdsRef = useRef(categoryOrderIds);
  const latestCustomCategoriesRef = useRef(customCategories);
  const latestHiddenSystemCategoryIdsRef = useRef(hiddenSystemCategoryIds);
  const latestSystemCategoryIconOverridesRef = useRef(systemCategoryIconOverrides);
  const latestSystemCategoryLabelOverridesRef = useRef(systemCategoryLabelOverrides);

  useEffect(() => {
    session.active = true;
    session.ready = !bookId;
    setIsLoadingCategories(Boolean(bookId));
    setIsSavingCategories(false);
    setCustomCategories(
      mapStoredCustomCategories(type, loadStoredCustomCategories(type, storageScope)),
    );
    setCategoryOrderIds(loadStoredCategoryOrderIds(type, storageScope));
    setHiddenSystemCategoryIds(loadStoredHiddenSystemCategoryIds(type, storageScope));
    setSystemCategoryIconOverrides(loadStoredSystemCategoryIconOverrides(type, storageScope));
    setSystemCategoryLabelOverrides(loadStoredSystemCategoryLabelOverrides(type, storageScope));
    return () => { session.active = false; };
  }, [storageScope, type, session]);

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
    let isMounted = true;
    let sharedRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    if (!bookId) {
      return () => {
        isMounted = false;
      };
    }

    const loadSharedCategories = async () => {
      if (session.pending > 0) return;
      const revision = session.revision;
      try {
        const nextCustomization = await fetchLedgerBookCategoryCustomization(bookId, type);
        if (!isMounted || !session.canApplyRead(revision)) {
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
        session.ready = true;
        setIsLoadingCategories(false);
      } catch (error) {
        if (isMounted) setIsLoadingCategories(false);
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
  }, [bookId, storageScope, type, session, reloadRevision]);

  return {
    isLoadingCategories,
    isSavingCategories,
    categoryOrderIds,
    customCategories,
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides,
    systemCategoryLabelOverrides,
    saveCategoryOrderIds: saveSharedCategoryOrder,
    saveCustomCategories: async (nextCategories) => {
      if (!session.active || session.pending > 0) return false;
      if (!session.ready) {
        setIsLoadingCategories(true);
        setReloadRevision((revision) => revision + 1);
        return false;
      }
      setIsSavingCategories(true);
      const nextStoredCategories = toStoredCustomCategories(nextCategories);
      try {
        await session.write(async () => {
          if (bookId) {
            await replaceLedgerBookCustomCategories(bookId, type, nextStoredCategories, latestCategoryOrderIdsRef.current);
          }
          saveStoredCustomCategories(type, nextStoredCategories, storageScope);
          if (session.active) {
            latestCustomCategoriesRef.current = nextCategories;
            setCustomCategories(nextCategories);
          }
        });
        return session.active;
      } catch (error) {
        logLedgerBookCategorySyncError(error, { bookId, step: "save_shared_custom_categories", type });
        return false;
      } finally {
        if (session.active) setIsSavingCategories(false);
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

  async function saveSharedCategoryOrder(nextCategoryOrderIds: string[]): Promise<boolean> {
    if (!session.active) return false;
    if (!session.ready) {
      setIsLoadingCategories(true);
      setReloadRevision((revision) => revision + 1);
      return false;
    }
    try {
      return await session.write(async () => {
        if (!session.active) return false;
        if (bookId) {
          await replaceLedgerBookCustomCategories(bookId, type,
            toStoredCustomCategories(latestCustomCategoriesRef.current), nextCategoryOrderIds);
          await replaceLedgerBookSystemCategoryCustomizations(bookId, type, {
            categoryOrderIds: nextCategoryOrderIds,
            hiddenSystemCategoryIds: latestHiddenSystemCategoryIdsRef.current,
            systemCategoryIconOverrides: latestSystemCategoryIconOverridesRef.current,
            systemCategoryLabelOverrides: latestSystemCategoryLabelOverridesRef.current,
          });
        }
        saveStoredCategoryOrderIds(type, nextCategoryOrderIds, storageScope);
        if (!session.active) return false;
        latestCategoryOrderIdsRef.current = nextCategoryOrderIds;
        setCategoryOrderIds(nextCategoryOrderIds);
        return true;
      });
    } catch (error) {
      logLedgerBookCategorySyncError(error, { bookId, type, step: "save_shared_category_order" });
      return false;
    }
  }
}
