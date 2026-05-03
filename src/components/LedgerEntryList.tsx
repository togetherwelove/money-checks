import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import type { LedgerEntry } from "../types/ledger";
import { LedgerEntryListItem } from "./LedgerEntryListItem";

type LedgerEntryListProps = {
  entries: LedgerEntry[];
  onDeleteEntry: (entry: LedgerEntry) => void | Promise<void>;
  onEditEntry: (entry: LedgerEntry) => void;
};

export function LedgerEntryList({ entries, onDeleteEntry, onEditEntry }: LedgerEntryListProps) {
  const categoryIconByLabel = useLedgerCategoryIconMap();

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
          categoryIconByLabel={categoryIconByLabel}
          entry={entry}
          key={entry.id}
          onDeleteEntry={onDeleteEntry}
          onEditEntry={onEditEntry}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: AppLayout.listItemGap,
  },
  emptyState: {
    flex: 1,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: AppColors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
});
