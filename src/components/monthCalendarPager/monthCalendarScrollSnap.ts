import type { MonthPage } from "./monthCalendarPagerUtils";
import type { MonthOffset } from "./monthCalendarPagerTypes";

const MIN_PAGE_INDEX = 0;
export const CURRENT_PAGE_INDEX = 1;
const MAX_PAGE_INDEX = 2;
const MONTH_PREVIEW_PROGRESS_THRESHOLD = 0.5;

export type MonthSectionLayout = {
  index: number;
  length: number;
  offset: number;
  snapOffset: number;
};

export type MonthScrollTransition = {
  monthOffset: MonthOffset;
  viewportHeight: number;
};

export function buildMonthSectionLayouts(
  pages: readonly MonthPage[],
  monthHeaderHeight: number,
): MonthSectionLayout[] {
  let offset = 0;

  return pages.map((page, index) => {
    const length = monthHeaderHeight + page.height;
    const layout = {
      index,
      length,
      offset,
      snapOffset: offset + monthHeaderHeight,
    };
    offset += length;
    return layout;
  });
}

export function resolveMonthOffsetFromScrollOffset(
  scrollOffset: number,
  layouts: readonly MonthSectionLayout[],
): MonthOffset {
  const closestLayout = layouts.reduce((closest, layout) =>
    Math.abs(layout.snapOffset - scrollOffset) < Math.abs(closest.snapOffset - scrollOffset)
      ? layout
      : closest,
  );

  return resolveMonthOffsetFromPageIndex(closestLayout.index);
}

export function resolveMonthScrollTransition(
  scrollOffset: number,
  pages: readonly MonthPage[],
  layouts: readonly MonthSectionLayout[],
): MonthScrollTransition {
  const currentLayout = layouts[CURRENT_PAGE_INDEX];
  const targetPageIndex =
    scrollOffset < currentLayout.snapOffset
      ? MIN_PAGE_INDEX
      : scrollOffset > currentLayout.snapOffset
        ? MAX_PAGE_INDEX
        : CURRENT_PAGE_INDEX;

  if (targetPageIndex === CURRENT_PAGE_INDEX) {
    return {
      monthOffset: 0,
      viewportHeight: pages[CURRENT_PAGE_INDEX].height,
    };
  }

  const targetLayout = layouts[targetPageIndex];
  const transitionDistance = Math.abs(targetLayout.snapOffset - currentLayout.snapOffset);
  const transitionProgress = Math.min(
    Math.abs(scrollOffset - currentLayout.snapOffset) / transitionDistance,
    1,
  );
  const currentHeight = pages[CURRENT_PAGE_INDEX].height;
  const targetHeight = pages[targetPageIndex].height;

  return {
    monthOffset:
      transitionProgress >= MONTH_PREVIEW_PROGRESS_THRESHOLD
        ? resolveMonthOffsetFromPageIndex(targetPageIndex)
        : 0,
    viewportHeight: currentHeight + (targetHeight - currentHeight) * transitionProgress,
  };
}

export function resolveMonthOffsetFromPageIndex(pageIndex: number): MonthOffset {
  const resolvedPageIndex = Math.max(MIN_PAGE_INDEX, Math.min(MAX_PAGE_INDEX, pageIndex));

  if (resolvedPageIndex < CURRENT_PAGE_INDEX) {
    return -1;
  }

  if (resolvedPageIndex > CURRENT_PAGE_INDEX) {
    return 1;
  }

  return 0;
}
