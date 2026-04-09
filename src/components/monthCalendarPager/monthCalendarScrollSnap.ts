const MIN_PAGE_INDEX = 0;
const CENTER_PAGE_INDEX = 1;
const MAX_PAGE_INDEX = 2;

export function resolveMonthOffsetFromScrollOffset(
  offsetY: number,
  pageHeight: number,
): -1 | 0 | 1 {
  const rawPageIndex = Math.round(offsetY / pageHeight);
  const pageIndex = Math.max(MIN_PAGE_INDEX, Math.min(MAX_PAGE_INDEX, rawPageIndex));

  if (pageIndex < CENTER_PAGE_INDEX) {
    return -1;
  }

  if (pageIndex > CENTER_PAGE_INDEX) {
    return 1;
  }

  return 0;
}
