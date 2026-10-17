import { useState } from "react";
import { AppSettingsCopy as Copy } from "../../constants/appSettings";
import { CATEGORY_OPTIONS } from "../../constants/categories";
import { CategoryCustomizerCopy, CUSTOM_CATEGORY_DEFAULT_ICON } from "../../constants/categoryCustomizer";
import type { useCustomCategories } from "../../hooks/useCustomCategories";
import { createCustomCategory, normalizeCustomCategoryLabel, resolveCustomCategoryError } from "../../lib/customCategories";
import type { CategoryIconName } from "../../types/category";
import type { LedgerEntryType } from "../../types/ledger";
import { CategoryCreateModal } from "../categorySelector/CategoryCreateModal";

export function SettingsCategoryCreateModal({ categories, entryType, onClose }: {
  categories: ReturnType<typeof useCustomCategories>; entryType: LedgerEntryType; onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [iconName, setIconName] = useState<CategoryIconName>(CUSTOM_CATEGORY_DEFAULT_ICON);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (categories.isLoadingCategories || categories.isSavingCategories) return;
    const nextCategory = {
      ...createCustomCategory(entryType, categories.customCategories.length + 1),
      label: normalizeCustomCategoryLabel(label), iconName,
    };
    const nextCategories = [...categories.customCategories, nextCategory];
    const baseCategories = CATEGORY_OPTIONS[entryType].map((category) => ({
      ...category, label: categories.systemCategoryLabelOverrides[category.id] ?? category.label,
    }));
    const validationError = resolveCustomCategoryError(baseCategories, nextCategories);
    if (validationError) { setError(validationError); return; }
    if (!await categories.saveCustomCategories(nextCategories)) {
      setError(CategoryCustomizerCopy.saveError);
      return;
    }
    onClose();
  }
  return <CategoryCreateModal isOpen
    title={entryType === "expense" ? Copy.addExpenseCategory : Copy.addIncomeCategory}
    isBusy={categories.isLoadingCategories || categories.isSavingCategories}
    label={label} iconName={iconName}
    errorMessage={categories.isLoadingCategories ? CategoryCustomizerCopy.loadingCategories : error}
    onChangeLabel={(value) => { setLabel(value); setError(null); }}
    onChangeIcon={setIconName} onCancel={onClose} onSubmit={submit}
  />;
}
