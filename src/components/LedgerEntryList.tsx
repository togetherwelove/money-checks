import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import { useLedgerCategoryLabelMap } from "../hooks/useLedgerCategoryLabelMap";
import type { LedgerEntry } from "../types/ledger";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";
import { LedgerEntryListItem } from "./LedgerEntryListItem";

type LedgerEntryListProps = {
  activeBookId?: string | null;
  entries: LedgerEntry[];
  onDeleteEntry: (entry: LedgerEntry) => void | Promise<void>;
  onAddFrequentEntry?: (entry: LedgerEntry) => void;
  onDuplicateEntry: (entry: LedgerEntry) => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
};

export function LedgerEntryList({
  activeBookId = null,
  entries,
  onDeleteEntry,
  onAddFrequentEntry,
  onDuplicateEntry,
  onEditEntry,
  onPrepayInstallmentEntry,
}: LedgerEntryListProps) {
  const styles = getStyles();
  useAppTheme();
  const categoryIconByKey = useLedgerCategoryIconMap(activeBookId);
  const categoryLabelById = useLedgerCategoryLabelMap(activeBookId);

  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{AppMessages.editorEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <LedgerEntryListItem
          categoryIconByKey={categoryIconByKey}
          categoryLabelById={categoryLabelById}
          entry={entry}
          key={entry.id}
          onDeleteEntry={onDeleteEntry}
          onAddFrequentEntry={onAddFrequentEntry}
          onDuplicateEntry={onDuplicateEntry}
          onEditEntry={onEditEntry}
          onPrepayInstallmentEntry={onPrepayInstallmentEntry}
        />
      ))}
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    list: {
      gap: AppLayout.listItemGap,
    },
    emptyState: {
      paddingVertical: AppLayout.cardContentPadding,
      alignItems: "center",
    },
    emptyText: {
      color: getAppColors().mutedText,
      fontSize: 12,
      textAlign: "center",
    },
  }),
);
