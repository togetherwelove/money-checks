import {
  CUSTOM_CATEGORY_DEFAULT_ICON,
  CUSTOM_CATEGORY_ID_PREFIX,
  CategoryCustomizerCopy,
} from "../constants/categoryCustomizer";
import type { CategoryDefinition, StoredCustomCategory } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

export function createCustomCategory(type: LedgerEntryType, nextIndex: number): CategoryDefinition {
  return {
    iconName: CUSTOM_CATEGORY_DEFAULT_ICON,
    id: `${CUSTOM_CATEGORY_ID_PREFIX}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    label: `${CategoryCustomizerCopy.newCategoryNamePrefix} ${nextIndex}`,
    source: "custom",
    type,
  };
}

export function mapStoredCustomCategories(
  type: LedgerEntryType,
  categories: readonly StoredCustomCategory[],
): CategoryDefinition[] {
  return categories.map((category) => ({
    ...category,
    source: "custom",
    type,
  }));
}

export function toStoredCustomCategories(
  categories: readonly CategoryDefinition[],
): StoredCustomCategory[] {
  return categories.map(({ iconName, id, label }) => ({ iconName, id, label }));
}

export function mergeCustomCategories(
  baseCategories: readonly CategoryDefinition[],
  customCategories: readonly CategoryDefinition[],
): CategoryDefinition[] {
  return [...baseCategories, ...customCategories];
}

export function sortCategoriesByOrderIds(
  categories: readonly CategoryDefinition[],
  categoryOrderIds: readonly string[],
): CategoryDefinition[] {
  if (categoryOrderIds.length === 0) {
    return [...categories];
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const sortedCategories = categoryOrderIds
    .map((categoryId) => categoryById.get(categoryId))
    .filter((category): category is CategoryDefinition => Boolean(category));
  const sortedCategoryIds = new Set(sortedCategories.map((category) => category.id));

  return [
    ...sortedCategories,
    ...categories.filter((category) => !sortedCategoryIds.has(category.id)),
  ];
}

export function normalizeCustomCategoryLabel(label: string): string {
  return label.trim();
}

export function resolveCustomCategoryError(
  baseCategories: readonly CategoryDefinition[],
  customCategories: readonly CategoryDefinition[],
): string | null {
  const existingLabels = new Set(baseCategories.map((category) => category.label));

  for (const category of customCategories) {
    const normalizedLabel = normalizeCustomCategoryLabel(category.label);
    if (!normalizedLabel) {
      return CategoryCustomizerCopy.emptyError;
    }

    if (existingLabels.has(normalizedLabel)) {
      return CategoryCustomizerCopy.duplicateError;
    }

    existingLabels.add(normalizedLabel);
  }

  return null;
}
