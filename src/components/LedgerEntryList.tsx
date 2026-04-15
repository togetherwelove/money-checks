import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CATEGORY_OPTIONS } from "../constants/categories";
import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import { useCustomCategories } from "../hooks/useCustomCategories";
import { formatInstallmentProgressLabel, stripInstallmentNoteSuffix } from "../lib/installments";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntry } from "../types/ledger";
import { formatCurrency } from "../utils/calendar";

type LedgerEntryListProps = {
  entries: LedgerEntry[];
  onDeleteEntry: (entry: LedgerEntry) => void | Promise<void>;
  onEditEntry: (entry: LedgerEntry) => void;
};

const ENTRY_META_SEPARATOR = " · ";
const FALLBACK_CATEGORY_ICON_NAME: CategoryIconName = "grid";
const CATEGORY_ICON_SIZE = 16;

export function LedgerEntryList({ entries, onDeleteEntry, onEditEntry }: LedgerEntryListProps) {
  const {
    customCategories: expenseCustomCategories,
    systemCategoryIconOverrides: expenseSystemCategoryIconOverrides,
  } = useCustomCategories("expense");
  const {
    customCategories: incomeCustomCategories,
    systemCategoryIconOverrides: incomeSystemCategoryIconOverrides,
  } = useCustomCategories("income");
  const categoryIconByLabel = useMemo(
    () =>
      buildCategoryIconByLabel([
        ...applySystemCategoryIconOverrides(
          CATEGORY_OPTIONS.expense,
          expenseSystemCategoryIconOverrides,
        ),
        ...applySystemCategoryIconOverrides(
          CATEGORY_OPTIONS.income,
          incomeSystemCategoryIconOverrides,
        ),
        ...expenseCustomCategories,
        ...incomeCustomCategories,
      ]),
    [
      expenseCustomCategories,
      expenseSystemCategoryIconOverrides,
      incomeCustomCategories,
      incomeSystemCategoryIconOverrides,
    ],
  );

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
                  style={[
                    styles.entryAmount,
                    entry.type === "income" ? styles.income : styles.expense,
                  ]}
                >
                  {entry.type === "income" ? "+" : "-"}
                  {formatCurrency(entry.amount)}
                </Text>
              </View>
              <Text style={styles.entryMeta}>{buildEntryMeta(entry)}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => onDeleteEntry(entry)} style={styles.deleteButton}>
            <Feather color={AppColors.expense} name="trash-2" size={16} />
          </Pressable>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  entryBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    gap: 8,
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
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    color: AppColors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
});

function buildEntryMeta(entry: LedgerEntry): string {
  const parts = [];

  parts.push(entry.category);

  const installmentProgressLabel = formatInstallmentProgressLabel(entry);
  if (installmentProgressLabel) {
    parts.push(installmentProgressLabel);
  }

  const noteLabel = stripInstallmentNoteSuffix(entry.note);
  if (noteLabel) {
    parts.push(noteLabel);
  }

  if (entry.authorName) {
    parts.push(entry.authorName);
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

function buildCategoryIconByLabel(
  categories: readonly CategoryDefinition[],
): Map<string, CategoryIconName> {
  return new Map(categories.map((category) => [category.label, category.iconName]));
}

function applySystemCategoryIconOverrides(
  categories: readonly CategoryDefinition[],
  iconOverrides: Record<string, CategoryIconName>,
): CategoryDefinition[] {
  return categories.map((category) => ({
    ...category,
    iconName: iconOverrides[category.id] ?? category.iconName,
  }));
}
