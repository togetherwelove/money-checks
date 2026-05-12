import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { AppColors } from "../constants/colors";
import { LedgerEntryListUi } from "../constants/ledgerEntryList";
import { AppMessages } from "../constants/messages";
import { formatInstallmentProgressLabel, stripInstallmentNoteSuffix } from "../lib/installments";
import type { CategoryIconName } from "../types/category";
import type { LedgerEntry } from "../types/ledger";
import { formatCurrency, formatEntryMetaDate } from "../utils/calendar";

type LedgerEntryListItemProps = {
  categoryIconByKey: Map<string, CategoryIconName>;
  categoryLabelById: Map<string, string>;
  entry: LedgerEntry;
  hasOpenSwipe?: boolean;
  isSwipeOpen?: boolean;
  onDeleteEntry: (entry: LedgerEntry) => void | Promise<void>;
  onEditEntry: (entry: LedgerEntry) => void;
  onRequestCloseOpenSwipe?: () => void;
  onSwipeClose?: (entryId: string) => void;
  onSwipeOpen?: (entryId: string) => void;
  showsDate?: boolean;
  showsInstallmentStatusLine?: boolean;
};

const ENTRY_META_SEPARATOR = " · ";
const FALLBACK_CATEGORY_ICON_NAME: CategoryIconName = "grid";
const CATEGORY_ICON_SIZE = 16;
const ENTRY_ATTACHMENT_ICON_SIZE = 12;
const ENTRY_ROW_GAP = 8;

type EntryMetaPart = {
  isFormerMemberName?: boolean;
  value: string;
};

export function LedgerEntryListItem({
  categoryIconByKey,
  categoryLabelById,
  entry,
  hasOpenSwipe = false,
  isSwipeOpen = false,
  onDeleteEntry,
  onEditEntry,
  onRequestCloseOpenSwipe,
  onSwipeClose,
  onSwipeOpen,
  showsDate = false,
  showsInstallmentStatusLine = false,
}: LedgerEntryListItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const installmentProgressLabel = formatInstallmentProgressLabel(entry);
  const noteLabel = stripInstallmentNoteSuffix(entry.note);
  const categoryLabel = categoryLabelById.get(entry.categoryId) ?? entry.category;

  useEffect(() => {
    if (!isSwipeOpen) {
      swipeableRef.current?.close();
    }
  }, [isSwipeOpen]);

  const handlePressEntry = () => {
    if (hasOpenSwipe) {
      swipeableRef.current?.close();
      onRequestCloseOpenSwipe?.();
      return;
    }

    onEditEntry(entry);
  };

  return (
    <Swipeable
      friction={LedgerEntryListUi.swipeFriction}
      onSwipeableClose={() => onSwipeClose?.(entry.id)}
      onSwipeableOpen={() => onSwipeOpen?.(entry.id)}
      overshootFriction={LedgerEntryListUi.swipeOvershootFriction}
      ref={swipeableRef}
      renderRightActions={() => (
        <Pressable
          accessibilityLabel={AppMessages.editorDeleteConfirmAction}
          onPress={() => {
            swipeableRef.current?.close();
            onDeleteEntry(entry);
          }}
          onTouchStart={(event) => event.stopPropagation()}
          style={styles.deleteSnapAction}
        >
          <Feather color={AppColors.inverseText} name="trash-2" size={16} />
          <Text style={styles.deleteSnapLabel}>{AppMessages.editorDeleteConfirmAction}</Text>
        </Pressable>
      )}
      rightThreshold={LedgerEntryListUi.swipeActionWidth}
    >
      <View style={styles.entryRow}>
        <Pressable onPress={handlePressEntry} style={styles.entryBody}>
          <View style={styles.entryLeadingIcon}>
            <Feather
              color={AppColors.mutedText}
              name={
                categoryIconByKey.get(entry.categoryId) ??
                categoryIconByKey.get(entry.category) ??
                FALLBACK_CATEGORY_ICON_NAME
              }
              size={CATEGORY_ICON_SIZE}
            />
          </View>
          <View style={styles.entryTextBlock}>
            <View style={styles.entryPrimaryRow}>
              <Text style={styles.entryContent} numberOfLines={1}>
                {resolveEntryContentLabel(entry, categoryLabel)}
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
            <View style={styles.entryMetaRow}>
              <Text style={styles.entryMeta} numberOfLines={1}>
                {buildEntryMainMetaParts({
                  entry,
                  categoryLabel,
                  noteLabel,
                  showsDate,
                }).map((part, index) => (
                  <Text
                    key={`${part.value}-${index}`}
                    style={part.isFormerMemberName ? styles.formerMemberName : null}
                  >
                    {index > 0 ? ENTRY_META_SEPARATOR : ""}
                    {part.value}
                  </Text>
                ))}
              </Text>
              {entry.photoAttachments.length > 0 ? (
                <Feather
                  color={AppColors.mutedText}
                  name="paperclip"
                  size={ENTRY_ATTACHMENT_ICON_SIZE}
                />
              ) : null}
              {!showsInstallmentStatusLine && installmentProgressLabel ? (
                <Text style={styles.entryMeta} numberOfLines={1}>
                  {ENTRY_META_SEPARATOR}
                  {installmentProgressLabel}
                </Text>
              ) : null}
            </View>
            {showsInstallmentStatusLine && installmentProgressLabel ? (
              <Text style={styles.entryStatus}>{installmentProgressLabel}</Text>
            ) : null}
          </View>
        </Pressable>
      </View>
    </Swipeable>
  );
}

function buildEntryMainMetaParts({
  categoryLabel,
  entry,
  noteLabel,
  showsDate,
}: {
  categoryLabel: string;
  entry: LedgerEntry;
  noteLabel: string;
  showsDate: boolean;
}): EntryMetaPart[] {
  const parts: EntryMetaPart[] = [];

  if (showsDate) {
    parts.push({ value: formatEntryMetaDate(entry.date) });
  }

  parts.push({ value: categoryLabel });

  if (entry.targetMemberName) {
    parts.push({
      isFormerMemberName: entry.targetMemberHasBookAccess === false,
      value: entry.targetMemberName,
    });
  } else if (entry.authorName) {
    parts.push({
      isFormerMemberName: entry.authorHasBookAccess === false,
      value: entry.authorName,
    });
  }

  if (noteLabel) {
    parts.push({ value: noteLabel });
  }

  return parts;
}

function resolveEntryContentLabel(entry: LedgerEntry, categoryLabel: string): string {
  const normalizedContent = entry.content.trim();
  if (normalizedContent) {
    return normalizedContent;
  }

  return categoryLabel;
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
    backgroundColor: AppColors.background,
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
  entryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    flexShrink: 1,
    color: AppColors.mutedText,
    fontSize: 12,
  },
  formerMemberName: {
    color: AppColors.formerMemberText,
  },
  entryStatus: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
  },
  deleteSnapAction: {
    width: LedgerEntryListUi.swipeActionWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: AppColors.expense,
  },
  deleteSnapLabel: {
    color: AppColors.inverseText,
    fontSize: 10,
    fontWeight: "700",
  },
});
