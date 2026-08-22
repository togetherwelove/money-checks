import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { AppColors } from "../../constants/colors";
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
  isRefreshing: boolean;
  onDeleteEntry: LedgerEntryDeleteHandler;
  onEditEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  onRefresh: () => Promise<void>;
};

export function HomeTransactionList({
  activeBookId,
  entries,
  isLoading,
  isRefreshing,
  onDeleteEntry,
  onEditEntry,
  onPrepayInstallmentEntry,
  onRefresh,
}: HomeTransactionListProps) {
  return (
    <ScrollView
      alwaysBounceVertical
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          onRefresh={() => {
            void onRefresh();
          }}
          refreshing={isRefreshing}
          tintColor={AppColors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      {isLoading && entries.length === 0 ? (
        <ActivityIndicator
          color={AppColors.primary}
          size="small"
          style={styles.loading}
        />
      ) : (
        <LedgerEntryList
          activeBookId={activeBookId}
          entries={entries}
          onDeleteEntry={(entry) => {
            showLedgerEntryDeleteAlert(entry, onDeleteEntry);
          }}
          onEditEntry={onEditEntry}
          onPrepayInstallmentEntry={onPrepayInstallmentEntry}
        />
      )}
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
