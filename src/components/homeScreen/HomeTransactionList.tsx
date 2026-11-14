import { useAppTheme } from "../../hooks/useAppTheme";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from "react-native";
import type { ReactNode } from "react";

import { getAppColors } from "../../constants/colors";
import { RefreshableScrollBehavior } from "../../constants/scroll";
import { useEntryAppendScroll } from "../../hooks/useEntryAppendScroll";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
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
  onRefresh: () => Promise<void>;
  selectedDate: string;
  onDeleteEntry: LedgerEntryDeleteHandler;
  onAddFrequentEntry?: (entry: LedgerEntry) => void;
  onDuplicateEntry: (entry: LedgerEntry) => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  entryAppend?: ReactNode;
};

export function HomeTransactionList({
  activeBookId,
  entries,
  isLoading,
  onRefresh,
  selectedDate,
  onDeleteEntry,
  onAddFrequentEntry,
  onDuplicateEntry,
  onEditEntry,
  onPrepayInstallmentEntry,
  entryAppend,
}: HomeTransactionListProps) {
  useAppTheme();
  const scope = `${activeBookId}:${selectedDate}`;
  const { isPullRefreshing, onPullRefresh } = usePullToRefresh(onRefresh, scope);
  const scroll = useEntryAppendScroll<ScrollViewInstance>(scope, isLoading, entries.length);
  return (
    <ScrollView
      {...RefreshableScrollBehavior}
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={() => {
            scroll.cancelPendingScroll();
            return onPullRefresh();
          }}
          tintColor={getAppColors().primary}
          colors={[getAppColors().primary]}
        />
      }
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
      {isLoading && entries.length === 0 && !isPullRefreshing ? (
        <View style={styles.loading}>
          <ActivityIndicator color={getAppColors().primary} size="small" />
        </View>
      ) : entries.length > 0 || !entryAppend ? (
        <LedgerEntryList
          activeBookId={activeBookId}
          entries={entries}
          onDeleteEntry={(entry) => {
            showLedgerEntryDeleteAlert(entry, onDeleteEntry);
          }}
          onAddFrequentEntry={onAddFrequentEntry}
          onDuplicateEntry={onDuplicateEntry}
          onEditEntry={onEditEntry}
          onPrepayInstallmentEntry={onPrepayInstallmentEntry}
        />
      ) : null}
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
    justifyContent: "center",
  },
});
