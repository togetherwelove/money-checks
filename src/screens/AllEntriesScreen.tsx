import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { LedgerEntryListItem } from "../components/LedgerEntryListItem";
import { AllEntriesCopy } from "../constants/allEntries";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import { useAllLedgerEntries } from "../hooks/useAllLedgerEntries";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerBook } from "../types/ledgerBook";

type AllEntriesScreenProps = {
  activeBook: LedgerBook | null;
  onDeleteEntry: (entry: LedgerEntry) => Promise<void>;
  onEditEntry: (entry: LedgerEntry) => void;
  trackBlockingTask: BusyTaskTracker;
};

export function AllEntriesScreen({
  activeBook,
  onDeleteEntry,
  onEditEntry,
  trackBlockingTask,
}: AllEntriesScreenProps) {
  const categoryIconByLabel = useLedgerCategoryIconMap();
  const { entries, errorMessage, isRefreshing, refreshEntries, removeEntryFromFeed } =
    useAllLedgerEntries({
      activeBookId: activeBook?.id ?? null,
      trackBlockingTask,
    });

  return (
    <View style={styles.screen}>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <FlatList
        contentContainerStyle={entries.length === 0 ? styles.emptyContent : styles.listContent}
        data={entries}
        keyExtractor={(entry) => entry.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{AllEntriesCopy.emptyTitle}</Text>
            <Text style={styles.emptyHint}>{AllEntriesCopy.emptyHint}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void refreshEntries();
            }}
            refreshing={isRefreshing}
            tintColor={AppColors.primary}
          />
        }
        renderItem={({ item }) => (
          <LedgerEntryListItem
            categoryIconByLabel={categoryIconByLabel}
            entry={item}
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
        )}
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
