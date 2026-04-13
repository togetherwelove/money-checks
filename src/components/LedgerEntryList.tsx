import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import type { LedgerEntry } from "../types/ledger";
import { formatCurrency } from "../utils/calendar";

type LedgerEntryListProps = {
  entries: LedgerEntry[];
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: LedgerEntry) => void;
};

const NOTE_SEPARATOR = " · ";

export function LedgerEntryList({ entries, onDeleteEntry, onEditEntry }: LedgerEntryListProps) {
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
        <View key={entry.id} style={styles.entryRow}>
          <View style={styles.entryTextBlock}>
            <Text
              style={[styles.entryAmount, entry.type === "income" ? styles.income : styles.expense]}
            >
              {entry.type === "income" ? "+" : "-"}
              {formatCurrency(entry.amount)}
            </Text>
            <Text style={styles.entryMeta}>{buildEntryMeta(entry)}</Text>
          </View>
          <View style={styles.entryActions}>
            <Pressable onPress={() => onEditEntry(entry)}>
              <Text style={styles.actionText}>{AppMessages.editorEdit}</Text>
            </Pressable>
            <Pressable onPress={() => onDeleteEntry(entry.id)}>
              <Text style={[styles.actionText, styles.deleteText]}>{AppMessages.editorDelete}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  emptyState: {
    flex: 1,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  entryTextBlock: {
    flex: 1,
    gap: 2,
  },
  entryAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
  income: {
    color: AppColors.income,
  },
  expense: {
    color: AppColors.expense,
  },
  entryMeta: {
    color: AppColors.mutedText,
    fontSize: 12,
  },
  entryActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionText: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  deleteText: {
    color: AppColors.expense,
  },
  emptyText: {
    color: AppColors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
});

function buildEntryMeta(entry: LedgerEntry): string {
  const parts = [];

  if (entry.content.trim()) {
    parts.push(entry.content.trim());
  }

  parts.push(entry.category);

  if (entry.note) {
    parts.push(entry.note);
  }

  if (entry.authorName) {
    parts.push(entry.authorName);
  }

  return parts.join(NOTE_SEPARATOR);
}
