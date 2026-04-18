import { useMemo } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppNativeAdCard } from "../components/AppNativeAdCard";
import { LedgerEntryListItem } from "../components/LedgerEntryListItem";
import { AllEntriesCopy } from "../constants/allEntries";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import { useAllLedgerEntries } from "../hooks/useAllLedgerEntries";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import { buildAllEntriesFeedItems } from "../lib/allEntriesFeedItems";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerBook } from "../types/ledgerBook";

type AllEntriesScreenProps = {
  activeBook: LedgerBook | null;
  onDeleteEntry: (entry: LedgerEntry) => Promise<void>;
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
  const categoryIconByLabel = useLedgerCategoryIconMap();
  const {
    entries,
    errorMessage,
    hasMore,
    isLoadingMore,
    isRefreshing,
    loadMoreEntries,
    refreshEntries,
    removeEntryFromFeed,
  } =
    useAllLedgerEntries({
      activeBookId: activeBook?.id ?? null,
      trackBlockingTask,
    });
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
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <FlatList
        contentContainerStyle={entries.length === 0 ? styles.emptyContent : styles.listContent}
        data={feedItems}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{AllEntriesCopy.emptyTitle}</Text>
            <Text style={styles.emptyHint}>{AllEntriesCopy.emptyHint}</Text>
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
              categoryIconByLabel={categoryIconByLabel}
              entry={item.entry}
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
              showsDate
              showsInstallmentStatusLine
            />
          )
        }
        style={styles.list}
      />
    </View>
  );

  async function handleDeleteEntry(entry: LedgerEntry) {
    await onDeleteEntry(entry);
    removeEntryFromFeed(entry.id);
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
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
});
