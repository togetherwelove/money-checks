const MIN_PAGE_INDEX = 0;
export const CURRENT_PAGE_INDEX = 1;
const MAX_PAGE_INDEX = 2;

export function resolveMonthOffsetFromPageIndex(pageIndex: number): -1 | 0 | 1 {
  const resolvedPageIndex = Math.max(MIN_PAGE_INDEX, Math.min(MAX_PAGE_INDEX, pageIndex));

  if (resolvedPageIndex < CURRENT_PAGE_INDEX) {
    return -1;
  }

  if (resolvedPageIndex > CURRENT_PAGE_INDEX) {
    return 1;
  }

  return 0;
}
