import { useMemo, useState } from "react";
import { AppSettingsCopy } from "../../constants/appSettings";
import { CATEGORY_OPTIONS } from "../../constants/categories";
import { useCustomCategories } from "../../hooks/useCustomCategories";
import { mergeCustomCategories, sortCategoriesByOrderIds } from "../../lib/customCategories";
import type { LedgerEntryType } from "../../types/ledger";
import { CategoryManageModal } from "../categorySelector/CategoryManageModal";
import { SettingsCategoryCreateModal } from "./SettingsCategoryCreateModal";

export function SettingsCategoryOrderModal({ bookId, onClose }: {
  bookId: string; onClose: () => void;
}) {
  const [entryType, setEntryType] = useState<LedgerEntryType>("expense");
  const [isAdding, setIsAdding] = useState(false);
  const customization = useCustomCategories(entryType, bookId);
  const { customCategories, categoryOrderIds, hiddenSystemCategoryIds,
    systemCategoryIconOverrides, systemCategoryLabelOverrides } = customization;
  const categories = useMemo(() => sortCategoriesByOrderIds(mergeCustomCategories(
    CATEGORY_OPTIONS[entryType]
      .filter((category) => !hiddenSystemCategoryIds.includes(category.id))
      .map((category) => ({ ...category,
        label: systemCategoryLabelOverrides[category.id] ?? category.label,
        iconName: systemCategoryIconOverrides[category.id] ?? category.iconName,
      })), customCategories), categoryOrderIds),
  [entryType, customCategories, categoryOrderIds, hiddenSystemCategoryIds, systemCategoryIconOverrides, systemCategoryLabelOverrides]);

  return <CategoryManageModal isOpen categories={categories}
    title={AppSettingsCopy.categoryModalTitle}
    entryType={entryType}
    onChangeEntryType={setEntryType}
    onAdd={() => setIsAdding(true)}
    creationModal={isAdding ? <SettingsCategoryCreateModal categories={customization} entryType={entryType} onClose={() => setIsAdding(false)} /> : null}
    isLoading={customization.isLoadingCategories}
    onClose={onClose}
    onChangeOrder={(nextCategories) => customization.saveCategoryOrderIds(nextCategories.map((category) => category.id))}
  />;
}
