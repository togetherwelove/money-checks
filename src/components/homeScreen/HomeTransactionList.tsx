import { ActivityIndicator, ScrollView, StyleSheet, type ScrollViewInstance } from "react-native";
import type { ReactNode } from "react";

import { AppColors } from "../../constants/colors";
import { AppScrollBehavior } from "../../constants/scroll";
import { useEntryAppendScroll } from "../../hooks/useEntryAppendScroll";
import { HomeScreenUi } from "../../constants/home";
import type { LedgerEntry } from "../../types/ledger";
import type { LedgerEntryDeleteHandler } from "../../types/ledgerEntryDeletion";
import type { InstallmentPrepaymentHandler } from "../../types/installmentTransactions";
import { AppFooterContentInset } from "../AppFooterContentInset";
import { LedgerEntryList } from "../LedgerEntryList";
import { showLedgerEntryDeleteAlert } from "../ledgerEntryDeleteAlert";

type HomeTransactionListProps = {
  activeBookId: string | null;
  entries: LedgerEntry[];
  isLoading: boolean;
  selectedDate: string;
  onDeleteEntry: LedgerEntryDeleteHandler;
  onDuplicateEntry: (entry: LedgerEntry) => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  entryAppend?: ReactNode;
};

export function HomeTransactionList({
  activeBookId,
  entries,
  isLoading,
  selectedDate,
  onDeleteEntry,
  onDuplicateEntry,
  onEditEntry,
  onPrepayInstallmentEntry,
  entryAppend,
}: HomeTransactionListProps) {
  const scroll = useEntryAppendScroll<ScrollViewInstance>(
    `${activeBookId}:${selectedDate}`,
    isLoading,
    entries.length,
  );
  return (
    <ScrollView
      {...AppScrollBehavior}
      ref={scroll.ref}
      onLayout={scroll.onLayout}
      onContentSizeChange={scroll.onContentSizeChange}
      onScrollBeginDrag={scroll.onScrollBeginDrag}
      onTouchStart={scroll.onTouchStart}
      nestedScrollEnabled
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      {isLoading && entries.length === 0 ? (
        <ActivityIndicator color={AppColors.primary} size="small" style={styles.loading} />
      ) : (
        <LedgerEntryList
          activeBookId={activeBookId}
          entries={entries}
          onDeleteEntry={(entry) => {
            showLedgerEntryDeleteAlert(entry, onDeleteEntry);
          }}
          onDuplicateEntry={onDuplicateEntry}
          onEditEntry={onEditEntry}
          onPrepayInstallmentEntry={onPrepayInstallmentEntry}
        />
      )}
      {entryAppend}
      <AppFooterContentInset />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  loading: {
    minHeight: HomeScreenUi.transactionMinimumHeight,
  },
});
