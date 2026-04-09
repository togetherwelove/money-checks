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

export function mergeCustomCategoryOrder(
  orderedCategories: readonly CategoryDefinition[],
  nextCustomCategories: readonly CategoryDefinition[],
): CategoryDefinition[] {
  const nextCustomMap = new Map(nextCustomCategories.map((category) => [category.id, category]));
  const nextCustomIds = nextCustomCategories.map((category) => category.id);
  const mergedCategories: CategoryDefinition[] = [];
  let customIndex = 0;

  for (const category of orderedCategories) {
    if (category.source !== "custom") {
      mergedCategories.push(category);
      continue;
    }

    const nextCustom = nextCustomMap.get(nextCustomIds[customIndex]);
    if (nextCustom) {
      mergedCategories.push(nextCustom);
    }
    customIndex += 1;
  }

  for (const category of nextCustomCategories) {
    if (!mergedCategories.some((currentCategory) => currentCategory.id === category.id)) {
      mergedCategories.push(category);
    }
  }

  return mergedCategories;
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

export function sortCustomCategoriesByVisibleOrder(
  customCategories: readonly CategoryDefinition[],
  orderedCategories: readonly CategoryDefinition[],
): CategoryDefinition[] {
  const orderedCustomIds = orderedCategories
    .filter((category) => category.source === "custom")
    .map((category) => category.id);
  const orderedCustomMap = new Map(customCategories.map((category) => [category.id, category]));
  const visibleCategories = orderedCustomIds
    .map((id) => orderedCustomMap.get(id))
    .filter((category): category is CategoryDefinition => Boolean(category));
  const remainingCategories = customCategories.filter(
    (category) => !orderedCustomIds.includes(category.id),
  );

  return [...visibleCategories, ...remainingCategories];
}
