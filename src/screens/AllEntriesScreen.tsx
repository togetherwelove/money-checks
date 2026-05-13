import { useDeferredValue, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppNativeAdCard } from "../components/AppNativeAdCard";
import { LedgerEntryListItem } from "../components/LedgerEntryListItem";
import { AllEntriesCopy, AllEntriesFilterUi } from "../constants/allEntries";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { FormInputTextStyle } from "../constants/uiStyles";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import { useAllLedgerEntries } from "../hooks/useAllLedgerEntries";
import { useLedgerCategories } from "../hooks/useLedgerCategories";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import { buildAllEntriesFeedItems } from "../lib/allEntriesFeedItems";
import type { CategoryDefinition } from "../types/category";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerBook } from "../types/ledgerBook";

type AllEntriesScreenProps = {
  activeBook: LedgerBook | null;
  onDeleteEntry: (entry: LedgerEntry) => Promise<boolean>;
  onEditEntry: (entry: LedgerEntry) => void;
  showsNativeAds: boolean;
  trackBlockingTask: BusyTaskTracker;
};

export function AllEntriesScreen({
  activeBook,
  onDeleteEntry,
  onEditEntry,
  showsNativeAds,
  trackBlockingTask,
}: AllEntriesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSwipeEntryId, setOpenSwipeEntryId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const activeBookId = activeBook?.id ?? null;
  const categories = useLedgerCategories(activeBookId);
  const categoryIconByKey = useLedgerCategoryIconMap(activeBookId);
  const categoryLabelById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
  const {
    entries,
    errorMessage,
    hasMore,
    isLoadingMore,
    isRefreshing,
    loadMoreEntries,
    refreshEntries,
    removeEntryFromFeed,
    restoreEntryToFeed,
  } = useAllLedgerEntries({
    activeBookId,
    selectedCategoryId,
    searchQuery: deferredSearchQuery,
    trackBlockingTask,
  });
  const isSearching = deferredSearchQuery.length > 0;
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
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setSearchQuery}
          onFocus={closeOpenSwipeEntry}
          placeholder={AllEntriesCopy.searchPlaceholder}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
        />
        <ScrollView
          contentContainerStyle={styles.categoryFilterContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterList}
        >
          <Pressable
            onPress={() => {
              closeOpenSwipeEntry();
              setSelectedCategoryId(null);
            }}
            style={[
              styles.categoryFilterChip,
              selectedCategoryId === null ? styles.activeCategoryFilterChip : null,
            ]}
          >
            <Text
              style={[
                styles.categoryFilterLabel,
                selectedCategoryId === null ? styles.activeCategoryFilterLabel : null,
              ]}
            >
              {AllEntriesCopy.allCategoriesFilterLabel}
            </Text>
          </Pressable>
          {categories.map((category) => (
            <CategoryFilterChip
              category={category}
              isSelected={selectedCategoryId === category.id}
              key={category.id}
              onPress={() => {
                closeOpenSwipeEntry();
                setSelectedCategoryId((currentCategoryId) =>
                  currentCategoryId === category.id ? null : category.id,
                );
              }}
            />
          ))}
        </ScrollView>
        <FlatList
          contentContainerStyle={entries.length === 0 ? styles.emptyContent : styles.listContent}
          data={feedItems}
          keyExtractor={(item) => item.key}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {isSearching ? AllEntriesCopy.emptySearchTitle : AllEntriesCopy.emptyTitle}
              </Text>
              <Text style={styles.emptyHint}>
                {isSearching ? AllEntriesCopy.emptySearchHint : AllEntriesCopy.emptyHint}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMoreState}>
                <Text style={styles.loadingMoreLabel}>{AllEntriesCopy.loadingLabel}</Text>
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
          onScrollBeginDrag={closeOpenSwipeEntry}
          onTouchStart={closeOpenSwipeEntry}
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
                hasOpenSwipe={openSwipeEntryId !== null}
                isSwipeOpen={openSwipeEntryId === item.entry.id}
                onDeleteEntry={(entry) => {
                  Alert.alert(
                    AppMessages.editorDeleteConfirmTitle,
                    AppMessages.editorDeleteConfirmMessage,
                    [
                      {
                        style: "cancel",
                        text: CommonActionCopy.cancel,
                      },
                      {
                        onPress: () => {
                          void handleDeleteEntry(entry);
                        },
                        style: "destructive",
                        text: AppMessages.editorDeleteConfirmAction,
                      },
                    ],
                  );
                }}
                onEditEntry={onEditEntry}
                onRequestCloseOpenSwipe={closeOpenSwipeEntry}
                onSwipeClose={(entryId) => {
                  setOpenSwipeEntryId((currentEntryId) =>
                    currentEntryId === entryId ? null : currentEntryId,
                  );
                }}
                onSwipeOpen={setOpenSwipeEntryId}
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

  async function handleDeleteEntry(entry: LedgerEntry) {
    removeEntryFromFeed(entry.id);
    const didDelete = await onDeleteEntry(entry);
    if (!didDelete) {
      restoreEntryToFeed(entry);
    }
  }

  function closeOpenSwipeEntry() {
    setOpenSwipeEntryId(null);
  }
}

function CategoryFilterChip({
  category,
  isSelected,
  onPress,
}: {
  category: CategoryDefinition;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
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
            : styles.expenseCategoryFilterLabel,
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
    backgroundColor: AppColors.background,
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
  content: {
    flex: 1,
    gap: AppLayout.cardGap,
  },
  list: {
    flex: 1,
  },
  searchInput: FormInputTextStyle,
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
    backgroundColor: AppColors.expenseSoft,
    opacity: AllEntriesFilterUi.typeTintBorderOpacity,
  },
  incomeCategoryFilterChip: {
    borderColor: AppColors.income,
    backgroundColor: AppColors.incomeSoft,
    opacity: AllEntriesFilterUi.typeTintBorderOpacity,
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
  expenseCategoryFilterLabel: {
    color: AppColors.expense,
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
});
