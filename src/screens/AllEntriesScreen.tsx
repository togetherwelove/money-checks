import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppNativeAdCard } from "../components/AppNativeAdCard";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { AllEntriesFilterBar } from "../components/allEntries/AllEntriesFilterBar";
import { AllEntriesFilterSheet } from "../components/allEntries/AllEntriesFilterSheet";
import { showLedgerEntryDeleteAlert } from "../components/ledgerEntryDeleteAlert";
import { LedgerEntryListItem } from "../components/LedgerEntryListItem";
import {
  type AllEntriesEntryTypeFilter,
  AllEntriesEntryTypeFilters,
  AllEntriesFilterCopy,
} from "../constants/allEntries";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import { useAllLedgerEntries } from "../hooks/useAllLedgerEntries";
import { useLedgerCategories } from "../hooks/useLedgerCategories";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import { resolveAllEntriesQueryCategoryIds } from "../lib/allEntriesFilters";
import { buildAllEntriesFeedItems } from "../lib/allEntriesFeedItems";
import type { LedgerEntry } from "../types/ledger";
import {
  LedgerEntryDeleteScopes,
  type LedgerEntryDeleteHandler,
  type LedgerEntryDeleteScope,
} from "../types/ledgerEntryDeletion";
import type { LedgerBook } from "../types/ledgerBook";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";

type AllEntriesScreenProps = {
  activeBook: LedgerBook | null;
  onDeleteEntry: LedgerEntryDeleteHandler;
  onEditEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  screenTitle: ReactNode;
  showsNativeAds: boolean;
  trackBlockingTask: BusyTaskTracker;
};

export function AllEntriesScreen({
  activeBook,
  onDeleteEntry,
  onEditEntry,
  onPrepayInstallmentEntry,
  screenTitle,
  showsNativeAds,
  trackBlockingTask,
}: AllEntriesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<AllEntriesEntryTypeFilter>(
    AllEntriesEntryTypeFilters.all,
  );
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const activeBookId = activeBook?.id ?? null;
  const categories = useLedgerCategories(activeBookId);
  const categoryIconByKey = useLedgerCategoryIconMap(activeBookId);
  const queryCategoryIds = useMemo(
    () =>
      resolveAllEntriesQueryCategoryIds(
        [...CATEGORY_OPTIONS.expense, ...CATEGORY_OPTIONS.income, ...categories],
        entryTypeFilter,
        selectedCategoryIds,
      ),
    [categories, entryTypeFilter, selectedCategoryIds],
  );
  const categoryLabelById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
  useEffect(() => {
    setSearchQuery("");
    setEntryTypeFilter(AllEntriesEntryTypeFilters.all);
    setIsFilterSheetOpen(false);
    setSelectedCategoryIds([]);
  }, [activeBookId]);
  const {
    entries,
    errorMessage,
    hasMore,
    isLoadingMore,
    isRefreshing,
    loadMoreEntries,
    refreshEntries,
    removeEntriesFromFeed,
  } = useAllLedgerEntries({
    activeBookId,
    selectedCategoryIds: queryCategoryIds,
    searchQuery: deferredSearchQuery,
    trackBlockingTask,
  });
  const hasAppliedFilters =
    deferredSearchQuery.length > 0 ||
    entryTypeFilter !== AllEntriesEntryTypeFilters.all ||
    selectedCategoryIds.length > 0;
  const feedItems = useMemo(() => {
    if (showsNativeAds) {
      return buildAllEntriesFeedItems(entries);
    }

    return entries.map((entry) => ({
      entry,
      key: entry.id,
      type: "entry" as const,
    }));
  }, [entries, showsNativeAds]);

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={entries.length === 0 ? styles.emptyContent : styles.listContent}
        data={feedItems}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.title}>{screenTitle}</View>
            <View style={styles.controls}>
              {errorMessage ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isRefreshing}
                  onPress={() => {
                    if (isRefreshing) {
                      return;
                    }

                    void refreshEntries();
                  }}
                  style={({ pressed }) => [
                    styles.errorRetry,
                    pressed && !isRefreshing ? styles.errorRetryPressed : null,
                    isRefreshing ? styles.errorRetryDisabled : null,
                  ]}
                >
                  <Text style={styles.error}>{errorMessage}</Text>
                  <Text style={styles.errorRetryLabel}>재시도</Text>
                </Pressable>
              ) : null}
              <AllEntriesFilterBar
                categories={categories}
                entryTypeFilter={entryTypeFilter}
                onChangeSearchQuery={setSearchQuery}
                onOpenFilter={() => setIsFilterSheetOpen(true)}
                onRemoveCategory={(categoryId) => {
                  setSelectedCategoryIds((currentCategoryIds) =>
                    currentCategoryIds.filter(
                      (currentCategoryId) => currentCategoryId !== categoryId,
                    ),
                  );
                }}
                onRemoveEntryType={() => {
                  setEntryTypeFilter(AllEntriesEntryTypeFilters.all);
                }}
                onReset={() => {
                  setSearchQuery("");
                  setEntryTypeFilter(AllEntriesEntryTypeFilters.all);
                  setSelectedCategoryIds([]);
                }}
                searchQuery={searchQuery}
                selectedCategoryIds={selectedCategoryIds}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {hasAppliedFilters
                ? AllEntriesFilterCopy.emptyFilterTitle
                : "표시할 기록이 없어요."}
            </Text>
            <Text style={styles.emptyHint}>
              {hasAppliedFilters
                ? AllEntriesFilterCopy.emptyFilterHint
                : "새로운 기록을 추가해 보세요."}
            </Text>
          </View>
        }
        ListFooterComponent={
          <>
            {isLoadingMore ? (
              <View style={styles.loadingMoreState}>
                <Text style={styles.loadingMoreLabel}>기록을 불러오는 중이에요.</Text>
              </View>
            ) : null}
            <AppFooterContentInset />
          </>
        }
        onEndReached={() => {
          if (!hasMore) {
            return;
          }

          void loadMoreEntries();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void refreshEntries();
            }}
            refreshing={isRefreshing}
            tintColor={AppColors.primary}
          />
        }
        renderItem={({ item }) =>
          item.type === "native-ad" ? (
            <AppNativeAdCard slotIndex={item.slotIndex} />
          ) : (
            <LedgerEntryListItem
              categoryIconByKey={categoryIconByKey}
              categoryLabelById={categoryLabelById}
              entry={item.entry}
              onDeleteEntry={(entry) => {
                showLedgerEntryDeleteAlert(entry, handleDeleteEntry);
              }}
              onEditEntry={onEditEntry}
              onPrepayInstallmentEntry={(entry) => {
                void handlePrepayInstallmentEntry(entry);
              }}
              showsDate
            />
          )
        }
        style={styles.list}
      />
      {isFilterSheetOpen ? (
        <AllEntriesFilterSheet
          categories={categories}
          entryTypeFilter={entryTypeFilter}
          onApply={(nextEntryTypeFilter, nextCategoryIds) => {
            setEntryTypeFilter(nextEntryTypeFilter);
            setSelectedCategoryIds([...nextCategoryIds]);
          }}
          onClose={() => setIsFilterSheetOpen(false)}
          selectedCategoryIds={selectedCategoryIds}
        />
      ) : null}
    </View>
  );

  async function handleDeleteEntry(entry: LedgerEntry, scope: LedgerEntryDeleteScope) {
    const didDelete = await onDeleteEntry(entry, scope);
    if (!didDelete) {
      return;
    }

    const deletedEntryIds =
      scope === LedgerEntryDeleteScopes.installmentGroup && entry.installmentGroupId
        ? entries
            .filter(
              (currentEntry) => currentEntry.installmentGroupId === entry.installmentGroupId,
            )
            .map((currentEntry) => currentEntry.id)
        : [entry.id];
    removeEntriesFromFeed(deletedEntryIds);
  }

  async function handlePrepayInstallmentEntry(entry: LedgerEntry) {
    if (await onPrepayInstallmentEntry(entry)) {
      await refreshEntries();
    }
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
    paddingTop: AppLayout.screenTopPadding,
  },
  listHeader: {
    gap: AppLayout.cardGap,
    paddingBottom: AppLayout.cardGap,
  },
  title: {
    paddingHorizontal: AppLayout.screenPadding,
  },
  controls: {
    gap: AppLayout.cardGap,
    paddingHorizontal: AppLayout.screenPadding,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    gap: 6,
  },
  loadingMoreState: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loadingMoreLabel: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyTitle: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyHint: {
    color: AppColors.mutedText,
    fontSize: 12,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
  errorRetry: {
    gap: 2,
    alignItems: "flex-start",
  },
  errorRetryPressed: {
    opacity: 0.7,
  },
  errorRetryDisabled: {
    opacity: 0.5,
  },
  errorRetryLabel: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
