import type { LedgerEntryType } from "../types/ledger";

export const AllEntriesEntryTypeFilters = {
  all: "all",
  expense: "expense",
  income: "income",
} as const;

export type AllEntriesEntryTypeFilter =
  | LedgerEntryType
  | typeof AllEntriesEntryTypeFilters.all;

export const AllEntriesEntryTypeFilterOptions: readonly {
  label: string;
  value: AllEntriesEntryTypeFilter;
}[] = [
  { label: "전체", value: AllEntriesEntryTypeFilters.all },
  { label: "지출", value: AllEntriesEntryTypeFilters.expense },
  { label: "수입", value: AllEntriesEntryTypeFilters.income },
];

export const AllEntriesFilterCopy = {
  applyLabel: "필터 적용",
  cancelLabel: "취소",
  categorySectionLabel: "분류",
  closeAccessibilityLabel: "필터 닫기",
  emptyFilterHint: "필터를 변경하거나 초기화해 주세요.",
  emptyFilterTitle: "조건에 맞는 기록이 없어요.",
  entryTypeSectionLabel: "거래 유형",
  expenseCategorySectionLabel: "지출",
  filterAccessibilityLabel: "전체 내역 필터 열기",
  filterLabel: "필터",
  incomeCategorySectionLabel: "수입",
  removeFilterAccessibilitySuffix: "필터 해제",
  resetAccessibilityLabel: "검색어와 전체 내역 필터 초기화",
  resetLabel: "초기화",
  searchPlaceholder: "내용과 메모 검색",
  sheetTitle: "필터",
} as const;

export const AllEntriesFilterUi = {
  activeFilterChipHorizontalPadding: 10,
  activeFilterChipHeight: 30,
  activeFilterChipIconSize: 13,
  activeFilterChipLabelFontSize: 12,
  badgeFontSize: 10,
  badgeMinimumSize: 18,
  categoryChipHorizontalPadding: 12,
  categoryChipMinimumHeight: 40,
  categoryChipRadius: 999,
  categoryIconSize: 14,
  categoryLabelFontSize: 13,
  filterButtonHorizontalPadding: 12,
  filterButtonLabelFontSize: 13,
  filterButtonMinimumHeight: 44,
  filterSheetMaximumHeightRatio: 0.82,
  filterSheetTopRadius: 20,
  headerTitleFontSize: 18,
  iconSize: 15,
  resetLabelFontSize: 12,
  sectionLabelFontSize: 12,
  sheetHandleHeight: 4,
  sheetHandleWidth: 36,
  typeOptionFontSize: 13,
  typeOptionMinimumHeight: 40,
} as const;

export function formatAllEntriesApplyLabel(filterCount: number): string {
  return filterCount > 0
    ? `${filterCount}개 ${AllEntriesFilterCopy.applyLabel}`
    : AllEntriesFilterCopy.applyLabel;
}

export function formatAllEntriesEntryTypeFilterLabel(
  entryTypeFilter: Exclude<
    AllEntriesEntryTypeFilter,
    typeof AllEntriesEntryTypeFilters.all
  >,
): string {
  return (
    AllEntriesEntryTypeFilterOptions.find((option) => option.value === entryTypeFilter)?.label ??
    ""
  );
}
