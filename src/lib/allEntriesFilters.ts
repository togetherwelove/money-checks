import {
  type AllEntriesEntryTypeFilter,
  AllEntriesEntryTypeFilters,
} from "../constants/allEntries";
import type { CategoryDefinition } from "../types/category";

export function countAllEntriesFilters(
  entryTypeFilter: AllEntriesEntryTypeFilter,
  selectedCategoryIds: readonly string[],
): number {
  return (
    selectedCategoryIds.length +
    (entryTypeFilter === AllEntriesEntryTypeFilters.all ? 0 : 1)
  );
}

export function filterCategoriesByEntryType(
  categories: readonly CategoryDefinition[],
  entryTypeFilter: AllEntriesEntryTypeFilter,
): CategoryDefinition[] {
  if (entryTypeFilter === AllEntriesEntryTypeFilters.all) {
    return [...categories];
  }

  return categories.filter((category) => category.type === entryTypeFilter);
}

export function pruneCategoryIdsForEntryType(
  categories: readonly CategoryDefinition[],
  selectedCategoryIds: readonly string[],
  entryTypeFilter: AllEntriesEntryTypeFilter,
): string[] {
  if (entryTypeFilter === AllEntriesEntryTypeFilters.all) {
    return [...selectedCategoryIds];
  }

  const matchingCategoryIds = new Set(
    categories
      .filter((category) => category.type === entryTypeFilter)
      .map((category) => category.id),
  );
  return selectedCategoryIds.filter((categoryId) => matchingCategoryIds.has(categoryId));
}

export function resolveAllEntriesQueryCategoryIds(
  categories: readonly CategoryDefinition[],
  entryTypeFilter: AllEntriesEntryTypeFilter,
  selectedCategoryIds: readonly string[],
): string[] {
  if (selectedCategoryIds.length > 0) {
    return [...new Set(selectedCategoryIds)];
  }

  if (entryTypeFilter === AllEntriesEntryTypeFilters.all) {
    return [];
  }

  return [
    ...new Set(
      categories
        .filter((category) => category.type === entryTypeFilter)
        .map((category) => category.id),
    ),
  ];
}
