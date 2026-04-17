import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { CardTitleTextStyle, CompactLabelTextStyle, SurfaceCardStyle } from "../constants/uiStyles";
import type { QueuedLedgerEntryDraft } from "../types/ledger";
import { formatAmountNumber } from "../utils/amount";
import { formatSelectedDate } from "../utils/calendar";

type QueuedLedgerEntryListProps = {
  entries: QueuedLedgerEntryDraft[];
  onPressEntryDate: (entryId: string) => void;
  onRemoveEntry: (entryId: string) => void;
};

function formatQueuedEntrySummary(entry: QueuedLedgerEntryDraft) {
  const amountPrefix = entry.draft.type === "income" ? "+ " : "- ";
  const summaryParts = [`${amountPrefix}${formatAmountNumber(Number(entry.draft.amount))}`];

  if (entry.draft.content.trim()) {
    summaryParts.push(entry.draft.content.trim());
  }

  summaryParts.push(entry.draft.category);

  if (entry.draft.note.trim()) {
    summaryParts.push(entry.draft.note.trim());
  }

  return summaryParts.join(EntryRegistrationCopy.summarySeparator);
}

export function QueuedLedgerEntryList({
  entries,
  onPressEntryDate,
  onRemoveEntry,
}: QueuedLedgerEntryListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {EntryRegistrationCopy.queuedEntriesCountLabel(entries.length)}
        </Text>
        <Text style={styles.caption}>{EntryRegistrationCopy.queuedEntriesTitle}</Text>
      </View>
      <View style={styles.list}>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <Pressable onPress={() => onPressEntryDate(entry.id)} style={styles.dateButton}>
              <Text style={styles.dateText}>{formatSelectedDate(entry.draft.date)}</Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.summaryText}>
              {formatQueuedEntrySummary(entry)}
            </Text>
            <Pressable onPress={() => onRemoveEntry(entry.id)} style={styles.removeButton}>
              <Text style={styles.removeText}>{EntryRegistrationCopy.removeQueuedEntryAction}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...SurfaceCardStyle,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  title: CardTitleTextStyle,
  caption: CompactLabelTextStyle,
  list: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateText: CompactLabelTextStyle,
  summaryText: {
    flex: 1,
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  removeButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  removeText: {
    color: AppColors.expense,
    fontSize: 12,
    fontWeight: "700",
  },
});
