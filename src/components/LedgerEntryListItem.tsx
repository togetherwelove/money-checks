import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { FrequentEntryCopy, FrequentEntryConfig } from "../constants/frequentEntries";
import { getLedgerEntryRowStyles, LedgerEntryRowUi } from "../constants/ledgerEntryRow";
import { Feather } from "./AppIcons";
import { type MenuAction, MenuView, type NativeActionEvent } from "@react-native-menu/menu";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { EntryComposerCopy } from "../constants/entryComposer";
import { InstallmentStatuses } from "../constants/installments";
import { AppMessages } from "../constants/messages";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import { formatInstallmentProgressLabel, stripInstallmentNoteSuffix } from "../lib/installments";
import type { CategoryIconName } from "../types/category";
import type { LedgerEntry } from "../types/ledger";
import { formatCurrency, formatEntryMetaDate } from "../utils/calendar";
import { InstallmentStatusBadge } from "./InstallmentStatusBadge";

type LedgerEntryListItemProps = {
  categoryIconByKey: Map<string, CategoryIconName>;
  categoryLabelById: Map<string, string>;
  entry: LedgerEntry;
  onDeleteEntry: (entry: LedgerEntry) => void | Promise<void>;
  onAddFrequentEntry?: (entry: LedgerEntry) => void;
  onDuplicateEntry: (entry: LedgerEntry) => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry?: (entry: LedgerEntry) => unknown;
  showsDate?: boolean;
};

const LedgerEntryMenuAction = {
  frequent: "frequent-entry",
  duplicate: "duplicate-entry",
  delete: "delete-entry",
  prepayInstallment: "prepay-installment",
} as const;
const ENTRY_META_SEPARATOR = " · ";
const FALLBACK_CATEGORY_ICON_NAME: CategoryIconName = "grid";
const CATEGORY_ICON_SIZE = LedgerEntryRowUi.iconSize;
const ENTRY_ATTACHMENT_ICON_SIZE = 12;
const LEDGER_ENTRY_DELETE_MENU_ICON_NAME = "trash";
const LEDGER_ENTRY_DUPLICATE_MENU_ICON_NAME = "doc.on.doc";
const LEDGER_ENTRY_PREPAY_MENU_ICON_NAME = "creditcard";
const LEDGER_ENTRY_MENU_PRESS_SUPPRESSION_MS = 800;
const getDeleteLedgerEntryMenuAction = createThemeValue(
  (): MenuAction => ({
    attributes: { destructive: true },
    id: LedgerEntryMenuAction.delete,
    image: LEDGER_ENTRY_DELETE_MENU_ICON_NAME,
    imageColor: getAppColors().expense,
    title: AppMessages.editorDeleteConfirmAction,
  }),
);
const getPrepayInstallmentMenuAction = createThemeValue(
  (): MenuAction => ({
    id: LedgerEntryMenuAction.prepayInstallment,
    image: LEDGER_ENTRY_PREPAY_MENU_ICON_NAME,
    imageColor: getAppColors().primary,
    title: EntryRegistrationCopy.installmentPrepaymentAction,
  }),
);
const getDuplicateLedgerEntryMenuAction = createThemeValue(
  (): MenuAction => ({
    id: LedgerEntryMenuAction.duplicate,
    image: LEDGER_ENTRY_DUPLICATE_MENU_ICON_NAME,
    imageColor: getAppColors().text,
    title: EntryComposerCopy.duplicate,
  }),
);
const getFrequentEntryMenuAction = createThemeValue(
  (): MenuAction => ({
    id: LedgerEntryMenuAction.frequent,
    title: FrequentEntryCopy.add,
    image: FrequentEntryConfig.addIcon,
    imageColor: getAppColors().text,
  }),
);
const getLedgerEntryMenuActions = createThemeValue((): MenuAction[] => [
  getDuplicateLedgerEntryMenuAction(),
  getDeleteLedgerEntryMenuAction(),
]);
const getInstallmentLedgerEntryMenuActions = createThemeValue((): MenuAction[] => [
  getDuplicateLedgerEntryMenuAction(),
  getPrepayInstallmentMenuAction(),
  getDeleteLedgerEntryMenuAction(),
]);

const getFrequentLedgerEntryMenuActions = createThemeValue(() => [
  ...getLedgerEntryMenuActions(),
  getFrequentEntryMenuAction(),
]);
const getFrequentInstallmentMenuActions = createThemeValue(() => [
  ...getInstallmentLedgerEntryMenuActions(),
  getFrequentEntryMenuAction(),
]);

type EntryMetaPart = {
  isFormerMemberName?: boolean;
  value: string;
};

export function LedgerEntryListItem({
  categoryIconByKey,
  categoryLabelById,
  entry,
  onDeleteEntry,
  onAddFrequentEntry,
  onDuplicateEntry,
  onEditEntry,
  onPrepayInstallmentEntry,
  showsDate = false,
}: LedgerEntryListItemProps) {
  const styles = getStyles();
  useAppTheme();
  const expenseTextStyle = useExpenseTextColor().textStyle;
  const installmentProgressLabel = formatInstallmentProgressLabel(entry);
  const isPrepaidInstallment = entry.installmentStatus === InstallmentStatuses.prepaid;
  const showsInstallmentPrepaymentAction = Boolean(
    onPrepayInstallmentEntry &&
      entry.type === "expense" &&
      entry.installmentGroupId &&
      entry.installmentStatus !== InstallmentStatuses.prepaid,
  );
  const noteLabel = stripInstallmentNoteSuffix(entry.note);
  const categoryLabel = categoryLabelById.get(entry.categoryId) ?? entry.category;
  const lastMenuInteractionAtRef = useRef(0);

  const handlePressEntry = () => {
    if (Date.now() - lastMenuInteractionAtRef.current < LEDGER_ENTRY_MENU_PRESS_SUPPRESSION_MS) {
      return;
    }

    onEditEntry(entry);
  };

  return (
    <View style={styles.entryRow}>
      <Pressable onPress={handlePressEntry} style={styles.entryPressable}>
        <MenuView
          actions={
            onAddFrequentEntry
              ? showsInstallmentPrepaymentAction
                ? getFrequentInstallmentMenuActions()
                : getFrequentLedgerEntryMenuActions()
              : showsInstallmentPrepaymentAction
                ? getInstallmentLedgerEntryMenuActions()
                : getLedgerEntryMenuActions()
          }
          isAnchoredToRight
          onCloseMenu={markMenuInteraction}
          onOpenMenu={markMenuInteraction}
          onPressAction={(event) => handlePressMenuAction(event)}
          shouldOpenOnLongPress
          style={styles.entryMenuAnchor}
        >
          <View pointerEvents="none" style={styles.entryBody}>
            <View style={styles.entryLeadingIcon}>
              <Feather
                color={getAppColors().mutedText}
                name={
                  categoryIconByKey.get(entry.categoryId) ??
                  categoryIconByKey.get(entry.category) ??
                  FALLBACK_CATEGORY_ICON_NAME
                }
                size={CATEGORY_ICON_SIZE}
              />
            </View>
            <View style={styles.entryTextBlock}>
              <Text style={styles.entryContent} numberOfLines={1}>
                {resolveEntryContentLabel(entry, categoryLabel)}
              </Text>
              <View style={styles.entryMetaRow}>
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.entryMeta}>
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
                  {!isPrepaidInstallment && installmentProgressLabel
                    ? `${ENTRY_META_SEPARATOR}${installmentProgressLabel}`
                    : ""}
                </Text>
                {entry.photoAttachments.length > 0 ? (
                  <Feather
                    color={getAppColors().mutedText}
                    name="paperclip"
                    size={ENTRY_ATTACHMENT_ICON_SIZE}
                  />
                ) : null}
                {isPrepaidInstallment ? <InstallmentStatusBadge entry={entry} /> : null}
              </View>
            </View>
            <Text
              style={[
                styles.entryAmount,
                entry.type === "income" ? styles.income : expenseTextStyle,
              ]}
            >
              {entry.type === "income" ? "+" : "-"}
              {formatCurrency(entry.amount)}
            </Text>
          </View>
        </MenuView>
      </Pressable>
    </View>
  );

  function markMenuInteraction() {
    lastMenuInteractionAtRef.current = Date.now();
  }

  function handlePressMenuAction(event: NativeActionEvent) {
    markMenuInteraction();

    if (event.nativeEvent.event === LedgerEntryMenuAction.frequent) {
      onAddFrequentEntry?.(entry);
      return;
    }

    if (event.nativeEvent.event === LedgerEntryMenuAction.duplicate) {
      onDuplicateEntry(entry);
      return;
    }

    if (event.nativeEvent.event === LedgerEntryMenuAction.delete) {
      onDeleteEntry(entry);
      return;
    }

    if (event.nativeEvent.event === LedgerEntryMenuAction.prepayInstallment) {
      onPrepayInstallmentEntry?.(entry);
    }
  }
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
    const isFormerMemberName = entry.targetMemberHasBookAccess === false;
    parts.push({
      isFormerMemberName,
      value: resolveMemberMetaName(entry.targetMemberName, isFormerMemberName),
    });
  } else if (entry.authorName) {
    const isFormerMemberName = entry.authorHasBookAccess === false;
    parts.push({
      isFormerMemberName,
      value: resolveMemberMetaName(entry.authorName, isFormerMemberName),
    });
  }

  if (noteLabel) {
    parts.push({ value: noteLabel });
  }

  return parts;
}

function resolveMemberMetaName(displayName: string, isFormerMemberName: boolean): string {
  return isFormerMemberName ? `${displayName} ${AppMessages.entryFormerMemberSuffix}` : displayName;
}

function resolveEntryContentLabel(entry: LedgerEntry, categoryLabel: string): string {
  const normalizedContent = entry.content.trim();
  if (normalizedContent) {
    return normalizedContent;
  }

  return categoryLabel;
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    entryRow: getLedgerEntryRowStyles().row,
    entryPressable: {
      flex: 1,
    },
    entryMenuAnchor: {
      flex: 1,
    },
    entryBody: getLedgerEntryRowStyles().body,
    entryLeadingIcon: getLedgerEntryRowStyles().leadingIcon,
    entryTextBlock: getLedgerEntryRowStyles().textBlock,
    entryMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    entryContent: getLedgerEntryRowStyles().content,
    entryAmount: getLedgerEntryRowStyles().amount,
    income: {
      color: getAppColors().income,
    },
    entryMeta: getLedgerEntryRowStyles().meta,
    formerMemberName: {
      color: getAppColors().expense,
      fontWeight: "700",
    },
  }),
);
