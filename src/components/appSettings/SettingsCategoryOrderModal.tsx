import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { AssetLinkConfig } from "../../constants/assetLink";
import { CategoryContextMenuCopy, CategoryCustomizerCopy } from "../../constants/categoryCustomizer";
import { hasLedgerBookLoans } from "../../lib/ledgerBookCategories";
import type { CategoryDefinition } from "../../types/category";
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
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | undefined>();
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

  async function canDelete(category: CategoryDefinition) {
    if (category.id !== AssetLinkConfig.loanCategoryId) return true;
    try {
      if (!await hasLedgerBookLoans(bookId)) return true;
      Alert.alert(CategoryContextMenuCopy.deleteConfirmTitle, CategoryContextMenuCopy.loanDeleteBlocked);
    } catch {
      Alert.alert(CategoryCustomizerCopy.saveError);
    }
    return false;
  }

  async function deleteCategory(category: CategoryDefinition) {
    if (!await canDelete(category)) return;
    if (category.source === "system") {
      customization.saveHiddenSystemCategoryIds([...hiddenSystemCategoryIds, category.id]);
    } else if (!await customization.saveCustomCategories(customCategories.filter((item) => item.id !== category.id))) {
      Alert.alert(CategoryCustomizerCopy.saveError);
    }
  }

  async function confirmDelete(category: CategoryDefinition) {
    if (!await canDelete(category)) return;
    Alert.alert(CategoryContextMenuCopy.deleteConfirmTitle, CategoryContextMenuCopy.deleteConfirmMessage, [
      { text: CategoryCustomizerCopy.keepEditingAction, style: "cancel" },
      { text: CategoryCustomizerCopy.deleteAction, style: "destructive", onPress: () => deleteCategory(category) },
    ]);
  }

  return <CategoryManageModal isOpen categories={categories}
    title={AppSettingsCopy.categoryModalTitle}
    entryType={entryType}
    onChangeEntryType={setEntryType}
    onAdd={() => setIsAdding(true)}
    onEdit={setEditingCategory}
    onDelete={confirmDelete}
    creationModal={isAdding || editingCategory ? <SettingsCategoryCreateModal key={editingCategory?.id ?? entryType} category={editingCategory} categories={customization} entryType={entryType} onClose={() => { setIsAdding(false); setEditingCategory(undefined); }} /> : null}
    isLoading={customization.isLoadingCategories}
    isBusy={customization.isSavingCategories}
    onClose={onClose}
    onChangeOrder={(nextCategories) => customization.saveCategoryOrderIds(nextCategories.map((category) => category.id))}
  />;
}
