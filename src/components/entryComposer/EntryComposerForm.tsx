import { useRef, type Ref, type RefObject } from "react";
import { Feather } from "../AppIcons";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from "react-native";

import { CATEGORY_OPTIONS } from "../../constants/categories";
import { CardSmsClipboardCopy } from "../../constants/cardSmsClipboard";
import { AppLayout } from "../../constants/layout";
import { AppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui } from "../../constants/entryComposer";
import { EntryRegistrationCopy } from "../../constants/entryRegistration";
import { FormLabelTextStyle, UnderlineFormInputTextStyle } from "../../constants/uiStyles";
import type { useEntryComposer } from "../../hooks/useEntryComposer";
import { formatAmountInput, sanitizeAmountValue } from "../../utils/amount";
import { CategorySelector } from "../CategorySelector";
import { EntryDateSelector } from "../EntryDateSelector";
import { EntryComposerDetails } from "./EntryComposerDetails";

type Props = {
  composer: ReturnType<typeof useEntryComposer>;
  bookId: string | null;
  disabled: boolean;
  editing: boolean;
  inputRef: Ref<TextInputInstance>;
  contentInputRef?: RefObject<TextInputInstance | null>;
  onChangeText?: () => void;
  onConvert?: () => void;
  onReadClipboard?: () => void;
};

const textActionHitSlop = {
  top: (Ui.fieldHeight - Ui.sheetTextFieldHeight) / 2,
  bottom: (Ui.fieldHeight - Ui.sheetTextFieldHeight) / 2,
};

export function EntryComposerForm({ composer, bookId, disabled, editing, inputRef, contentInputRef: providedContentInputRef, onChangeText, onConvert, onReadClipboard }: Props) {
  const { draft, update } = composer;
  const fallbackContentInputRef = useRef<TextInputInstance>(null);
  const contentInputRef = providedContentInputRef ?? fallbackContentInputRef;
  return (
    <View style={styles.form}>
      <View style={styles.dateRow}>
        <EntryDateSelector compact inline selectedDate={draft.date} onSelectDate={date => update("date", date)} />
        {onReadClipboard ? <Pressable accessibilityRole="button"
          accessibilityLabel={CardSmsClipboardCopy.showSuggestion}
          accessibilityState={{ disabled }} disabled={disabled}
          onPress={() => { if (!disabled) onReadClipboard(); }} style={[styles.inputAction, styles.clipboardAction]}>
          <Feather name="clipboard" size={Ui.cancelIconSize} color={AppColors.mutedText} />
        </Pressable> : null}
      </View>
      {(["amount", "content", "note"] as const).map(field => {
        const label = field === "amount" ? Copy.amount : field === "content" ? EntryRegistrationCopy.contentLabel : EntryRegistrationCopy.noteLabel;
        const input = <TextInput
            key={field}
            ref={field === "amount" ? inputRef : field === "content" ? contentInputRef : undefined}
            accessibilityLabel={label}
            editable={!disabled}
            keyboardAppearance="light"
            keyboardType={field === "amount" ? "decimal-pad" : "default"}
            multiline={field !== "amount"}
            returnKeyType={field === "amount" ? "next" : field === "content" ? "done" : "default"}
            submitBehavior={field === "amount" ? "submit" : field === "content" ? "blurAndSubmit" : "newline"}
            inputAccessoryViewButtonLabel={field === "amount" ? Copy.nextContent : undefined}
            onSubmitEditing={() => {
              if (disabled) return;
              if (field === "amount") contentInputRef.current?.focus();
            }}
            placeholder={field === "amount" ? Copy.amount : field === "content" ? EntryRegistrationCopy.contentPlaceholder : EntryRegistrationCopy.notePlaceholder}
            placeholderTextColor={AppColors.mutedText}
            style={[styles.input, field === "amount" ? styles.amountInput : styles.textInput]}
            value={field === "amount" ? formatAmountInput(draft.amount) : draft[field]}
            onChangeText={value => {
              if (disabled) return;
              onChangeText?.();
              update(field, field === "amount" ? sanitizeAmountValue(value) : value);
            }}
          />;
        const clearLabel = field === "amount" ? EntryRegistrationCopy.amountClearAccessibilityLabel
          : field === "content" ? EntryRegistrationCopy.contentClearAccessibilityLabel : Copy.clearNote;
        return <View key={field} style={styles.fieldRow}>
          {input}
          {draft[field] ? <Pressable accessibilityRole="button" accessibilityLabel={clearLabel}
            accessibilityState={{ disabled }} disabled={disabled}
            hitSlop={field === "amount" ? undefined : textActionHitSlop}
            style={[styles.inputAction, field !== "amount" && styles.textInputAction]}
            onPress={() => {
              if (disabled) return;
              onChangeText?.();
              update(field, "");
            }}>
            <Feather name="x-circle" size={Ui.cancelIconSize} color={AppColors.mutedText} />
          </Pressable> : null}
        </View>;
      })}
      <CategorySelector title={EntryRegistrationCopy.categoryLabel} bookId={bookId} categories={CATEGORY_OPTIONS[draft.type]} entryType={draft.type}
        selectedCategoryId={draft.categoryId} onSelectCategory={category => {
          update("category", category?.label ?? "");
          update("categoryId", category?.id ?? "");
        }} />
      <View style={styles.detailsSection}>
        <Text accessibilityRole="header" style={styles.label}>{Copy.details}</Text>
        <EntryComposerDetails composer={composer} editing={editing} onConvert={onConvert} showDate={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateRow: { minHeight: Ui.fieldHeight },
  clipboardAction: { position: "absolute", top: 0, right: 0, minHeight: Ui.fieldHeight },
  form: { gap: Ui.sheetSectionGap },
  detailsSection: { paddingTop: Ui.detailsSectionTopPadding, gap: Ui.detailsHeadingGap },
  label: FormLabelTextStyle,
  input: {
    ...UnderlineFormInputTextStyle,
    flex: 1,
    minWidth: 0,
    borderBottomWidth: 0,
    minHeight: Ui.sheetFieldHeight,
    fontSize: Ui.sheetFieldFontSize,
    lineHeight: Ui.sheetFieldLineHeight,
    paddingVertical: Ui.sheetFieldVerticalPadding,
  },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: AppLayout.cardGap,
    borderBottomWidth: AppLayout.dividerWidth, borderBottomColor: AppColors.border },
  amountInput: { fontSize: Ui.sheetAmountFontSize, lineHeight: Ui.sheetAmountLineHeight, fontWeight: "600" },
  textInput: { minHeight: Ui.sheetTextFieldHeight, paddingVertical: Ui.sheetTextFieldVerticalPadding },
  textInputAction: { minHeight: Ui.sheetTextFieldHeight },
  inputAction: { alignItems: "center", justifyContent: "center",
    flexShrink: 0, minWidth: Ui.sheetFieldHeight, minHeight: Ui.sheetFieldHeight },
});
