import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CardSmsClipboardCopy } from "../constants/cardSmsClipboard";
import { getAppColors } from "../constants/colors";
import { EntryAppendCopy as Copy } from "../constants/entryAppend";
import {
  EntryComposerCopy,
  EntryComposerUi,
  type EntryComposerUnavailableReason,
} from "../constants/entryComposer";
import { getLedgerEntryRowStyles, LedgerEntryRowUi } from "../constants/ledgerEntryRow";
import { AppLayout } from "../constants/layout";
import { CompactTextProps } from "../constants/textLayout";
import { useClipboardExpansionAnimation } from "../hooks/useClipboardExpansionAnimation";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { CardSmsClipboardDraft } from "../lib/cardSmsClipboardImport";
import { formatSelectedDateWithYear } from "../utils/calendar";
import { formatCurrency } from "../utils/currency";
import { Feather } from "./AppIcons";
import { IconActionButton } from "./IconActionButton";

type Props = {
  selectedDate: string;
  disabled: boolean;
  unavailableReason?: EntryComposerUnavailableReason;
  clipboardDraft: CardSmsClipboardDraft | null;
  onAdd: () => void;
  onApplyClipboard: () => void;
  onDismissClipboard: () => void;
  hintLabel?: string;
};

export function LedgerEntryAppendRow({
  selectedDate,
  disabled,
  unavailableReason,
  clipboardDraft: draft,
  onAdd,
  onApplyClipboard,
  onDismissClipboard,
  hintLabel,
}: Props) {
  const styles = getStyles();
  useAppTheme();
  const progress = useClipboardExpansionAnimation(Boolean(draft));
  const expenseTextStyle = useExpenseTextColor().textStyle;
  const date = formatSelectedDateWithYear(draft?.date ?? selectedDate);
  const amount = draft ? formatCurrency(Number(draft.amount)) : null;
  const hint = disabled
    ? unavailableReason === "no-book"
      ? EntryComposerCopy.selectBookHint
      : unavailableReason === "read-only"
        ? EntryComposerCopy.unavailable
        : EntryComposerCopy.loading
    : draft
      ? date
      : (hintLabel ?? date);
  const title = draft?.content ?? Copy.add;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[styles.row, disabled && styles.disabled, draft && { opacity: progress }]}
    >
      <View pointerEvents="none" style={[styles.outline, draft && styles.previewOutline]} />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        accessibilityLabel={
          draft ? `${title}, ${amount}, ${hint}, ${Copy.review}` : `${title}, ${hint}`
        }
        onPress={() => {
          if (!disabled) (draft ? onApplyClipboard : onAdd)();
        }}
        style={({ pressed }) => [
          styles.action,
          !draft && styles.addAction,
          pressed && styles.pressed,
        ]}
      >
        <View style={getLedgerEntryRowStyles().leadingIcon}>
          <Feather
            name={draft ? "clipboard" : "plus"}
            size={LedgerEntryRowUi.iconSize}
            color={getAppColors().primary}
          />
        </View>
        <View style={getLedgerEntryRowStyles().textBlock}>
          <Text
            {...CompactTextProps}
            numberOfLines={1}
            style={[getLedgerEntryRowStyles().content, !draft && styles.addTitle]}
          >
            {title}
          </Text>
          <Text {...CompactTextProps} numberOfLines={1} style={getLedgerEntryRowStyles().meta}>
            {hint}
          </Text>
        </View>
        {draft ? (
          <View style={styles.amountBlock}>
            <Text
              {...CompactTextProps}
              style={[
                getLedgerEntryRowStyles().amount,
                draft.type === "income" ? styles.income : expenseTextStyle,
              ]}
            >
              {amount}
            </Text>
            <Text {...CompactTextProps} style={styles.review}>
              {Copy.review}
            </Text>
          </View>
        ) : null}
      </Pressable>
      {draft ? (
        <IconActionButton
          icon="x"
          size="compact"
          disabled={disabled}
          accessibilityLabel={CardSmsClipboardCopy.dismissSuggestion}
          onPress={onDismissClipboard}
        />
      ) : null}
    </Animated.View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    row: {
      ...getLedgerEntryRowStyles().row,
      borderBottomWidth: 0,
      marginVertical: AppLayout.compactGap,
    },
    outline: {
      ...StyleSheet.absoluteFill,
      left: AppLayout.compactGap,
      right: AppLayout.compactGap,
      borderWidth: AppLayout.dividerWidth,
      borderRadius: AppLayout.groupRadius,
      borderColor: getAppColors().border,
      borderStyle: "dashed",
      backgroundColor: getAppColors().surfaceMuted,
    },
    previewOutline: {
      borderStyle: "solid",
    },
    action: { ...getLedgerEntryRowStyles().body, flex: 1, minHeight: EntryComposerUi.fieldHeight },
    addAction: { paddingLeft: AppLayout.screenPadding },
    addTitle: { color: getAppColors().primary },
    amountBlock: { alignItems: "flex-end", gap: getLedgerEntryRowStyles().textBlock.gap },
    review: { ...getLedgerEntryRowStyles().meta, color: getAppColors().primary },
    income: { color: getAppColors().income },
    pressed: { backgroundColor: getAppColors().surfaceMuted },
    disabled: { opacity: EntryComposerUi.disabledOpacity },
  }),
);
