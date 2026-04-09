export function moveCategoryItem(
  categories: readonly string[],
  fromIndex: number,
  toIndex: number,
): string[] {
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

export function resolvePreviewCategoryOrder(
  categories: readonly string[],
  draggedCategory: string,
  toIndex: number,
): string[] {
  const fromIndex = categories.indexOf(draggedCategory);
  return moveCategoryItem(categories, fromIndex, toIndex);
}

export function resolveCategoryOrder(
  baseCategories: readonly string[],
  storedCategories: readonly string[] | null | undefined,
): string[] {
  if (!storedCategories?.length) {
    return [...baseCategories];
  }

  const knownCategories = new Set(baseCategories);
  const orderedCategories = storedCategories.filter((category) => knownCategories.has(category));
  const seenCategories = new Set(orderedCategories);
  const remainingCategories = baseCategories.filter((category) => !seenCategories.has(category));

  return [...orderedCategories, ...remainingCategories];
}
