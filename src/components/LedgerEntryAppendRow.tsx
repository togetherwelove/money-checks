import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CardSmsClipboardCopy } from "../constants/cardSmsClipboard";
import { AppColors } from "../constants/colors";
import { EntryAppendCopy as Copy } from "../constants/entryAppend";
import {
  EntryComposerCopy,
  EntryComposerUi,
  type EntryComposerUnavailableReason,
} from "../constants/entryComposer";
import { LedgerEntryRowStyles as Row, LedgerEntryRowUi } from "../constants/ledgerEntryRow";
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
};

export function LedgerEntryAppendRow({
  selectedDate,
  disabled,
  unavailableReason,
  clipboardDraft: draft,
  onAdd,
  onApplyClipboard,
  onDismissClipboard,
}: Props) {
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
    : date;
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
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <View style={Row.leadingIcon}>
          <Feather
            name={draft ? "clipboard" : "plus"}
            size={LedgerEntryRowUi.iconSize}
            color={AppColors.primary}
          />
        </View>
        <View style={Row.textBlock}>
          <Text
            {...CompactTextProps}
            numberOfLines={1}
            style={[Row.content, !draft && styles.addTitle]}
          >
            {title}
          </Text>
          <Text {...CompactTextProps} numberOfLines={1} style={Row.meta}>
            {hint}
          </Text>
        </View>
        {draft ? (
          <View style={styles.amountBlock}>
            <Text
              {...CompactTextProps}
              style={[Row.amount, draft.type === "income" ? styles.income : expenseTextStyle]}
            >
              {amount}
            </Text>
            <Text {...CompactTextProps} style={styles.review}>
              {Copy.review}
            </Text>
          </View>
        ) : (
          <Feather
            name="chevron-right"
            size={LedgerEntryRowUi.iconSize}
            color={AppColors.mutedText}
          />
        )}
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

const styles = StyleSheet.create({
  row: {
    ...Row.row,
    borderBottomWidth: 0,
    marginVertical: AppLayout.compactGap,
  },
  outline: {
    ...StyleSheet.absoluteFill,
    left: AppLayout.compactGap,
    right: AppLayout.compactGap,
    borderWidth: AppLayout.dividerWidth,
    borderRadius: AppLayout.groupRadius,
    borderColor: AppColors.border,
    borderStyle: "dashed",
    backgroundColor: AppColors.surfaceMuted,
  },
  previewOutline: {
    borderStyle: "solid",
  },
  action: { ...Row.body, flex: 1, minHeight: EntryComposerUi.fieldHeight },
  addTitle: { color: AppColors.primary },
  amountBlock: { alignItems: "flex-end", gap: Row.textBlock.gap },
  review: { ...Row.meta, color: AppColors.primary },
  income: { color: AppColors.income },
  pressed: { backgroundColor: AppColors.surfaceMuted },
  disabled: { opacity: EntryComposerUi.disabledOpacity },
});
