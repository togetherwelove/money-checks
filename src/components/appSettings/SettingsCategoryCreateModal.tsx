import { useState } from "react";
import { AppSettingsCopy as Copy } from "../../constants/appSettings";
import { CATEGORY_OPTIONS } from "../../constants/categories";
import { CategoryContextMenuCopy, CategoryCustomizerCopy, CUSTOM_CATEGORY_DEFAULT_ICON } from "../../constants/categoryCustomizer";
import type { useCustomCategories } from "../../hooks/useCustomCategories";
import { createCustomCategory, normalizeCustomCategoryLabel, resolveCustomCategoryError } from "../../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../../types/category";
import type { LedgerEntryType } from "../../types/ledger";
import { CategoryCreateModal } from "../categorySelector/CategoryCreateModal";

export function SettingsCategoryCreateModal({ categories, entryType, category, onClose }: {
  category?: CategoryDefinition; categories: ReturnType<typeof useCustomCategories>; entryType: LedgerEntryType; onClose: () => void;
}) {
  const [label, setLabel] = useState(category?.label ?? "");
  const [iconName, setIconName] = useState<CategoryIconName>(category?.iconName ?? CUSTOM_CATEGORY_DEFAULT_ICON);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (categories.isLoadingCategories || categories.isSavingCategories) return;
    const nextCategory = {
      ...(category ?? createCustomCategory(entryType, categories.customCategories.length + 1)),
      label: normalizeCustomCategoryLabel(label), iconName,
    };
    const nextCategories = category
      ? categories.customCategories.map((item) => item.id === category.id ? nextCategory : item)
      : [...categories.customCategories, nextCategory];
    const baseCategories = CATEGORY_OPTIONS[entryType].map((category) => ({
      ...category, label: categories.systemCategoryLabelOverrides[category.id] ?? category.label,
    }));
    const validationError = resolveCustomCategoryError(
      category?.source === "system"
        ? baseCategories.map((item) => item.id === category.id ? nextCategory : item)
        : baseCategories,
      nextCategories,
    );
    if (validationError) { setError(validationError); return; }
    if (category?.source === "system") {
      categories.saveSystemCategoryCustomizations({
        hiddenSystemCategoryIds: categories.hiddenSystemCategoryIds,
        systemCategoryLabelOverrides: { ...categories.systemCategoryLabelOverrides, [category.id]: nextCategory.label },
        systemCategoryIconOverrides: { ...categories.systemCategoryIconOverrides, [category.id]: iconName },
      });
      onClose();
      return;
    }
    if (!await categories.saveCustomCategories(nextCategories)) {
      setError(CategoryCustomizerCopy.saveError);
      return;
    }
    onClose();
  }
  return <CategoryCreateModal isOpen
    title={category ? CategoryContextMenuCopy.editModalTitle : entryType === "expense" ? Copy.addExpenseCategory : Copy.addIncomeCategory}
    actionLabel={category ? CategoryCustomizerCopy.saveAction : undefined}
    isBusy={categories.isLoadingCategories || categories.isSavingCategories}
    label={label} iconName={iconName}
    errorMessage={categories.isLoadingCategories ? CategoryCustomizerCopy.loadingCategories : error}
    onChangeLabel={(value) => { setLabel(value); setError(null); }}
    onChangeIcon={setIconName} onCancel={onClose} onSubmit={submit}
  />;
}
