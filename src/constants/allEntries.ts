import { selectStaticCopy } from "../i18n/staticCopy";

export const AllEntriesCopy = selectStaticCopy({
  en: {
    allCategoriesFilterLabel: "All",
    emptyHint: "Add a new entry.",
    emptySearchHint: "Check your search terms.",
    emptySearchTitle: "No matching entries.",
    emptyTitle: "No entries to show.",
    loadingLabel: "Loading entries.",
    openActionLabel: "View All Entries",
    screenTitle: "All Entries",
    searchPlaceholder: "Search description and memo",
  },
  ko: {
    allCategoriesFilterLabel: "전체",
    emptyHint: "새로운 기록을 추가해 보세요.",
    emptySearchHint: "검색어를 다시 확인해 주세요.",
    emptySearchTitle: "검색한 기록이 없어요.",
    emptyTitle: "표시할 기록이 없어요.",
    loadingLabel: "기록을 불러오는 중이에요.",
    openActionLabel: "전체 내역 보기",
    screenTitle: "전체 내역",
    searchPlaceholder: "내용과 메모 검색",
  },
} as const);

export const AllEntriesFilterUi = {
  typeTintBorderOpacity: 0.52,
} as const;
