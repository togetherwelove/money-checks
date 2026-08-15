import { Feather } from "@expo/vector-icons";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";

import { AppNativeAdCard } from "../components/AppNativeAdCard";
import { showLedgerEntryDeleteAlert } from "../components/ledgerEntryDeleteAlert";
import { LedgerEntryListItem } from "../components/LedgerEntryListItem";
import { AllEntriesFilterCopy } from "../constants/allEntries";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { FormInputTextStyle } from "../constants/uiStyles";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import { useAllLedgerEntries } from "../hooks/useAllLedgerEntries";
import { useLedgerCategories } from "../hooks/useLedgerCategories";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import { buildAllEntriesFeedItems } from "../lib/allEntriesFeedItems";
import type { CategoryDefinition } from "../types/category";
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
  showsNativeAds: boolean;
  trackBlockingTask: BusyTaskTracker;
};

export function AllEntriesScreen({
  activeBook,
  onDeleteEntry,
  onEditEntry,
  onPrepayInstallmentEntry,
  showsNativeAds,
  trackBlockingTask,
}: AllEntriesScreenProps) {
  const expenseTextStyle = useExpenseTextColor().textStyle;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const activeBookId = activeBook?.id ?? null;
  const categories = useLedgerCategories(activeBookId);
  const categoryIconByKey = useLedgerCategoryIconMap(activeBookId);
  const selectedCategoryIdSet = useMemo(
    () => new Set(selectedCategoryIds),
    [selectedCategoryIds],
  );
  const categoryLabelById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
  useEffect(() => {
    setSearchQuery("");
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
    selectedCategoryIds,
    searchQuery: deferredSearchQuery,
    trackBlockingTask,
  });
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategoryIds.length > 0;
  const hasAppliedFilters = deferredSearchQuery.length > 0 || selectedCategoryIds.length > 0;
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
      <View style={styles.content}>
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
          <View style={styles.searchRow}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={setSearchQuery}
              placeholder="내용과 메모 검색"
              returnKeyType="search"
              style={[styles.searchInput, styles.searchInputInRow]}
              value={searchQuery}
            />
            <Pressable
              accessibilityLabel={AllEntriesFilterCopy.resetAccessibilityLabel}
              accessibilityRole="button"
              disabled={!hasActiveFilters}
              onPress={() => {
                setSearchQuery("");
                setSelectedCategoryIds([]);
              }}
              style={({ pressed }) => [
                styles.resetFilterButton,
                !hasActiveFilters ? styles.disabledResetFilterButton : null,
                pressed && hasActiveFilters ? styles.pressedResetFilterButton : null,
              ]}
            >
              <Feather color={AppColors.primary} name="rotate-ccw" size={15} />
              <Text style={styles.resetFilterLabel}>{AllEntriesFilterCopy.resetLabel}</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.categoryFilterContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilterList}
          >
            <Pressable
              accessibilityState={{ selected: selectedCategoryIds.length === 0 }}
              accessibilityRole="button"
              onPress={() => {
                setSelectedCategoryIds([]);
              }}
              style={[
                styles.categoryFilterChip,
                selectedCategoryIds.length === 0 ? styles.activeCategoryFilterChip : null,
              ]}
            >
              <Text
                style={[
                  styles.categoryFilterLabel,
                  selectedCategoryIds.length === 0 ? styles.activeCategoryFilterLabel : null,
                ]}
              >
                전체
              </Text>
            </Pressable>
            {categories.map((category) => (
              <CategoryFilterChip
                category={category}
                expenseTextStyle={expenseTextStyle}
                isSelected={selectedCategoryIdSet.has(category.id)}
                key={category.id}
                onPress={() => {
                  setSelectedCategoryIds((currentCategoryIds) =>
                    currentCategoryIds.includes(category.id)
                      ? currentCategoryIds.filter(
                          (currentCategoryId) => currentCategoryId !== category.id,
                        )
                      : [...currentCategoryIds, category.id],
                  );
                }}
              />
            ))}
          </ScrollView>
        </View>
        <FlatList
          contentContainerStyle={entries.length === 0 ? styles.emptyContent : styles.listContent}
          data={feedItems}
          keyExtractor={(item) => item.key}
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
            isLoadingMore ? (
              <View style={styles.loadingMoreState}>
                <Text style={styles.loadingMoreLabel}>기록을 불러오는 중이에요.</Text>
              </View>
            ) : null
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
                showsInstallmentStatusLine
              />
            )
          }
          style={styles.list}
        />
      </View>
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

function CategoryFilterChip({
  category,
  expenseTextStyle,
  isSelected,
  onPress,
}: {
  category: CategoryDefinition;
  expenseTextStyle: StyleProp<TextStyle>;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityState={{ selected: isSelected }}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.categoryFilterChip,
        category.type === "income"
          ? styles.incomeCategoryFilterChip
          : styles.expenseCategoryFilterChip,
        isSelected
          ? category.type === "income"
            ? styles.activeIncomeCategoryFilterChip
            : styles.activeExpenseCategoryFilterChip
          : null,
      ]}
    >
      <Text
        style={[
          styles.categoryFilterLabel,
          category.type === "income"
            ? styles.incomeCategoryFilterLabel
            : expenseTextStyle,
          isSelected ? styles.activeCategoryFilterLabel : null,
        ]}
      >
        {category.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
    paddingTop: AppLayout.screenTopPadding,
  },
  content: {
    flex: 1,
    gap: AppLayout.cardGap,
  },
  controls: {
    gap: AppLayout.cardGap,
    paddingHorizontal: AppLayout.screenPadding,
  },
  list: {
    flex: 1,
  },
  searchInput: FormInputTextStyle,
  searchInputInRow: {
    flex: 1,
    minWidth: 0,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppLayout.compactGap,
  },
  resetFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 4,
  },
  disabledResetFilterButton: {
    opacity: 0.38,
  },
  pressedResetFilterButton: {
    opacity: 0.7,
  },
  resetFilterLabel: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  categoryFilterList: {
    flexGrow: 0,
  },
  categoryFilterContent: {
    gap: 8,
    paddingRight: AppLayout.screenPadding,
  },
  categoryFilterChip: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  activeCategoryFilterChip: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  expenseCategoryFilterChip: {
    borderColor: AppColors.expense,
    backgroundColor: AppColors.screenBackground,
  },
  incomeCategoryFilterChip: {
    borderColor: AppColors.income,
    backgroundColor: AppColors.surface,
  },
  activeExpenseCategoryFilterChip: {
    borderColor: AppColors.expense,
    backgroundColor: AppColors.expense,
    opacity: 1,
  },
  activeIncomeCategoryFilterChip: {
    borderColor: AppColors.income,
    backgroundColor: AppColors.income,
    opacity: 1,
  },
  categoryFilterLabel: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  incomeCategoryFilterLabel: {
    color: AppColors.income,
  },
  activeCategoryFilterLabel: {
    color: AppColors.inverseText,
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
