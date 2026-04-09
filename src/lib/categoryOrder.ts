type CategoryOrderItem = {
  id: string;
};

export function moveCategoryItem<T>(
  categories: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= categories.length ||
    toIndex >= categories.length ||
    fromIndex === toIndex
  ) {
    return [...categories];
  }

  const nextCategories = [...categories];
  const [movedCategory] = nextCategories.splice(fromIndex, 1);
  nextCategories.splice(toIndex, 0, movedCategory);
  return nextCategories;
}

export function resolvePreviewCategoryOrder<T extends CategoryOrderItem>(
  categories: readonly T[],
  draggedCategoryId: string,
  toIndex: number,
): T[] {
  const fromIndex = categories.findIndex((category) => category.id === draggedCategoryId);
  return moveCategoryItem(categories, fromIndex, toIndex);
}

export function resolveCategoryOrder<T extends CategoryOrderItem>(
  baseCategories: readonly T[],
  storedCategoryIds: readonly string[] | null | undefined,
): T[] {
  if (!storedCategoryIds?.length) {
    return [...baseCategories];
  }

  const categoryMap = new Map(baseCategories.map((category) => [category.id, category]));
  const orderedCategories = storedCategoryIds
    .map((categoryId) => categoryMap.get(categoryId))
    .filter((category): category is T => Boolean(category));
  const seenCategories = new Set(orderedCategories.map((category) => category.id));
  const remainingCategories = baseCategories.filter((category) => !seenCategories.has(category.id));

  return [...orderedCategories, ...remainingCategories];
}
