import { AppFontSize } from "./typography";
import type { LedgerEntryType } from "../types/ledger";

export const AllEntriesEntryTypeFilters = {
  all: "all",
  expense: "expense",
  income: "income",
} as const;

export type AllEntriesEntryTypeFilter = LedgerEntryType | typeof AllEntriesEntryTypeFilters.all;

export const AllEntriesEntryTypeFilterOptions: readonly {
  label: string;
  value: AllEntriesEntryTypeFilter;
}[] = [
  { label: "전체", value: AllEntriesEntryTypeFilters.all },
  { label: "지출", value: AllEntriesEntryTypeFilters.expense },
  { label: "수입", value: AllEntriesEntryTypeFilters.income },
];

export const AllEntriesFilterCopy = {
  loadingLabel: "내역을 불러오는 중이에요.",
  sheetTitle: "내역 필터",
  applyLabel: "필터 적용",
  cancelLabel: "취소",
  closeAccessibilityLabel: "필터 닫기",
  emptyFilterHint: "필터를 변경하거나 초기화해 주세요.",
  emptyFilterTitle: "조건에 맞는 기록이 없어요.",
  expenseCategorySectionLabel: "지출",
  filterAccessibilityLabel: "전체 내역 필터 열기",
  filterLabel: "필터",
  incomeCategorySectionLabel: "수입",
  removeFilterAccessibilitySuffix: "필터 해제",
  resetAccessibilityLabel: "검색어와 전체 내역 필터 초기화",
  resetLabel: "초기화",
  resetDraftLabel: "전체 초기화",
  resetDraftAccessibilityLabel: "기간과 분류 필터 초기화",
  searchPlaceholder: "내용과 메모 검색",
} as const;

export const AllEntriesFilterUi = {
  activeFilterChipHorizontalPadding: 10,
  activeFilterChipHeight: 30,
  activeFilterChipIconSize: 13,
  activeFilterChipLabelFontSize: AppFontSize.caption,
  badgeFontSize: AppFontSize.caption,
  badgeMinimumSize: 18,
  categoryChipHorizontalPadding: 12,
  categoryChipMinimumHeight: 40,
  categoryChipRadius: 999,
  categoryIconSize: 14,
  categoryLabelFontSize: AppFontSize.body,
  filterButtonHorizontalPadding: 12,
  filterButtonLabelFontSize: AppFontSize.body,
  filterButtonMinimumHeight: 44,
  iconSize: 15,
  resetLabelFontSize: AppFontSize.caption,
  sectionLabelFontSize: AppFontSize.caption,
  typeOptionFontSize: AppFontSize.body,
  typeOptionMinimumHeight: 36,
  typeOptionsMaxWidth: 216,
  typeOptionHitSlop: { top: 4, bottom: 4 },
} as const;

export function formatAllEntriesApplyLabel(filterCount: number): string {
  return filterCount > 0
    ? `${filterCount}개 ${AllEntriesFilterCopy.applyLabel}`
    : AllEntriesFilterCopy.applyLabel;
}

export function formatAllEntriesEntryTypeFilterLabel(
  entryTypeFilter: Exclude<AllEntriesEntryTypeFilter, typeof AllEntriesEntryTypeFilters.all>,
): string {
  return (
    AllEntriesEntryTypeFilterOptions.find((option) => option.value === entryTypeFilter)?.label ?? ""
  );
}

export type AllEntriesDateRange = { startDate: string; endDate: string };
export type ReportCategory = { id: string; label: string };
export type OpenReportCategoryEntries = (
  categories: ReportCategory[],
  entryType: LedgerEntryType,
  dateRange?: AllEntriesDateRange,
) => void;
export type ReportCategoryFilter = {
  bookId: string;
  requestId: number;
  categories: ReportCategory[];
  entryType: LedgerEntryType;
  dateRange?: AllEntriesDateRange;
};
export const AllEntriesPeriodCopy = {
  title: "기간",
  all: "전체 기간",
  custom: "기간 지정",
  start: "시작일",
  end: "종료일",
  expense: "총 지출",
  income: "총 수입",
  loading: "합계 계산 중…",
  error: "합계를 불러오지 못했어요.",
} as const;

export const AllEntriesPeriodPresets = [
  { value: "this-month", label: "이번 달" },
  { value: "last-month", label: "지난달" },
  { value: "this-year", label: "올해" },
] as const;
export type AllEntriesPeriodPreset = (typeof AllEntriesPeriodPresets)[number]["value"];

export const AllEntriesFilterDesign = {
  categoryColumns: 3,
  categoryTileHeight: 72,
  categoryTilePadding: 6,
  categoryTileContentGap: 4,
  tileRadius: 16,
  selectionIconSize: 12,
  selectionBadgeSize: 18,
} as const;
