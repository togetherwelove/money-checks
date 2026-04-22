import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { formatInstallmentProgressLabel, stripInstallmentNoteSuffix } from "../lib/installments";
import type { CategoryIconName } from "../types/category";
import type { LedgerEntry } from "../types/ledger";
import { formatCurrency, formatEntryMetaDate } from "../utils/calendar";

type LedgerEntryListItemProps = {
  categoryIconByLabel: Map<string, CategoryIconName>;
  entry: LedgerEntry;
  onDeleteEntry: (entry: LedgerEntry) => void | Promise<void>;
  onEditEntry: (entry: LedgerEntry) => void;
  showsDate?: boolean;
  showsInstallmentStatusLine?: boolean;
};

const ENTRY_META_SEPARATOR = " · ";
const FALLBACK_CATEGORY_ICON_NAME: CategoryIconName = "grid";
const CATEGORY_ICON_SIZE = 16;
const ENTRY_ROW_GAP = 8;

export function LedgerEntryListItem({
  categoryIconByLabel,
  entry,
  onDeleteEntry,
  onEditEntry,
  showsDate = false,
  showsInstallmentStatusLine = false,
}: LedgerEntryListItemProps) {
  const installmentProgressLabel = formatInstallmentProgressLabel(entry);
  const noteLabel = stripInstallmentNoteSuffix(entry.note);

  return (
    <View style={styles.entryRow}>
      <Pressable onPress={() => onEditEntry(entry)} style={styles.entryBody}>
        <View style={styles.entryLeadingIcon}>
          <Feather
            color={AppColors.mutedText}
            name={categoryIconByLabel.get(entry.category) ?? FALLBACK_CATEGORY_ICON_NAME}
            size={CATEGORY_ICON_SIZE}
          />
        </View>
        <View style={styles.entryTextBlock}>
          <View style={styles.entryPrimaryRow}>
            <Text style={styles.entryContent} numberOfLines={1}>
              {resolveEntryContentLabel(entry)}
            </Text>
            <Text
              style={[styles.entryAmount, entry.type === "income" ? styles.income : styles.expense]}
            >
              {entry.type === "income" ? "+" : "-"}
              {formatCurrency(entry.amount)}
            </Text>
          </View>
          <Text style={styles.entryMeta}>
            {buildEntryMeta({
              entry,
              installmentProgressLabel,
              noteLabel,
              showsDate,
              showsInstallmentStatusLine,
            })}
          </Text>
          {showsInstallmentStatusLine && installmentProgressLabel ? (
            <Text style={styles.entryStatus}>{installmentProgressLabel}</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable onPress={() => onDeleteEntry(entry)} style={styles.deleteButton}>
        <Feather color={AppColors.expense} name="trash-2" size={16} />
      </Pressable>
    </View>
  );
}

function buildEntryMeta({
  entry,
  installmentProgressLabel,
  noteLabel,
  showsDate,
  showsInstallmentStatusLine,
}: {
  entry: LedgerEntry;
  installmentProgressLabel: string | null;
  noteLabel: string;
  showsDate: boolean;
  showsInstallmentStatusLine: boolean;
}) {
  const parts: string[] = [];

  if (showsDate) {
    parts.push(formatEntryMetaDate(entry.date));
  }

  parts.push(entry.category);

  if (entry.targetMemberName) {
    parts.push(entry.targetMemberName);
  } else if (entry.authorName) {
    parts.push(entry.authorName);
  }

  if (noteLabel) {
    parts.push(noteLabel);
  }

  if (!showsInstallmentStatusLine && installmentProgressLabel) {
    parts.push(installmentProgressLabel);
  }

  return parts.join(ENTRY_META_SEPARATOR);
}

function resolveEntryContentLabel(entry: LedgerEntry): string {
  const normalizedContent = entry.content.trim();
  if (normalizedContent) {
    return normalizedContent;
  }

  return entry.category;
}

const styles = StyleSheet.create({
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ENTRY_ROW_GAP,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  entryBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: ENTRY_ROW_GAP,
  },
  entryLeadingIcon: {
    width: 20,
    alignItems: "center",
  },
  entryTextBlock: {
    flex: 1,
    gap: 2,
  },
  entryPrimaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: ENTRY_ROW_GAP,
  },
  entryContent: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "600",
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
  entryStatus: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 4,
  },
});
