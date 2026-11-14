import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useRef, type Ref, type RefObject, type ReactNode } from "react";
import { Feather } from "../AppIcons";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from "react-native";

import { CATEGORY_OPTIONS } from "../../constants/categories";
import { AppLayout } from "../../constants/layout";
import { getAppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui } from "../../constants/entryComposer";
import { EntryRegistrationCopy } from "../../constants/entryRegistration";
import { getFormLabelTextStyle, getUnderlineFormInputTextStyle } from "../../constants/uiStyles";
import type { useEntryComposer } from "../../hooks/useEntryComposer";
import { formatAmountInput, sanitizeAmountValue } from "../../utils/amount";
import { CategorySelector } from "../CategorySelector";
import { EntryTypeToggleButton } from "../EntryTypeToggleButton";
import { EntryComposerDetails } from "./EntryComposerDetails";
import { EntryAssetLinkFields } from "./EntryAssetLinkFields";
import { AssetLinkConfig } from "../../constants/assetLink";
import { ONE_TIME_INSTALLMENT_MONTHS } from "../../utils/ledgerEntries";

type Props = {
  visible: boolean;
  composer: ReturnType<typeof useEntryComposer>;
  bookId: string | null;
  disabled: boolean;
  editing: boolean;
  inputRef: Ref<TextInputInstance>;
  contentInputRef?: RefObject<TextInputInstance | null>;
  onChangeText?: () => void;
  onConvert?: () => void;
  editingEntryId?: string;
  frequentEntriesControl?: ReactNode;
};

const textActionHitSlop = {
  top: (Ui.fieldHeight - Ui.sheetTextFieldHeight) / 2,
  bottom: (Ui.fieldHeight - Ui.sheetTextFieldHeight) / 2,
};

export function EntryComposerForm({
  visible,
  composer,
  bookId,
  disabled,
  editing,
  inputRef,
  contentInputRef: providedContentInputRef,
  onChangeText,
  onConvert,
  editingEntryId,
  frequentEntriesControl,
}: Props) {
  const styles = getStyles();
  const colorScheme = useAppTheme();
  const { draft, update } = composer;
  const fallbackContentInputRef = useRef<TextInputInstance>(null);
  const contentInputRef = providedContentInputRef ?? fallbackContentInputRef;
  return (
    <View style={styles.form}>
      <View style={styles.toolbar}>
        <View style={styles.typeControl}>
          <EntryTypeToggleButton
            selectedType={draft.type}
            disabled={disabled}
            onSelectType={(type) => {
              if (disabled || type === draft.type) return;
              update("type", type);
              update("category", "");
              update("categoryId", "");
            }}
          />
        </View>
        {frequentEntriesControl}
      </View>
      {(["amount", "content", "note"] as const).map((field) => {
        const label =
          field === "amount"
            ? Copy.amount
            : field === "content"
              ? EntryRegistrationCopy.contentLabel
              : EntryRegistrationCopy.noteLabel;
        const input = (
          <TextInput
            key={field}
            ref={field === "amount" ? inputRef : field === "content" ? contentInputRef : undefined}
            accessibilityLabel={label}
            editable={!disabled}
            keyboardAppearance={colorScheme}
            keyboardType={field === "amount" ? "decimal-pad" : "default"}
            multiline={field !== "amount"}
            returnKeyType={field === "amount" ? "next" : field === "content" ? "done" : "default"}
            submitBehavior={
              field === "amount" ? "submit" : field === "content" ? "blurAndSubmit" : "newline"
            }
            inputAccessoryViewButtonLabel={field === "amount" ? Copy.nextContent : undefined}
            onSubmitEditing={() => {
              if (disabled) return;
              if (field === "amount") contentInputRef.current?.focus();
            }}
            placeholder={
              field === "amount"
                ? Copy.amount
                : field === "content"
                  ? EntryRegistrationCopy.contentPlaceholder
                  : EntryRegistrationCopy.notePlaceholder
            }
            placeholderTextColor={getAppColors().mutedText}
            style={styles.input}
            value={field === "amount" ? formatAmountInput(draft.amount) : draft[field]}
            onChangeText={(value) => {
              if (disabled) return;
              onChangeText?.();
              update(field, field === "amount" ? sanitizeAmountValue(value) : value);
            }}
          />
        );
        const clearLabel =
          field === "amount"
            ? EntryRegistrationCopy.amountClearAccessibilityLabel
            : field === "content"
              ? EntryRegistrationCopy.contentClearAccessibilityLabel
              : Copy.clearNote;
        return (
          <View key={field} style={styles.fieldRow}>
            {input}
            {draft[field] ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={clearLabel}
                accessibilityState={{ disabled }}
                disabled={disabled}
                hitSlop={textActionHitSlop}
                style={styles.inputAction}
                onPress={() => {
                  if (disabled) return;
                  onChangeText?.();
                  update(field, "");
                }}
              >
                <Feather
                  name="x-circle"
                  size={Ui.cancelIconSize}
                  color={getAppColors().mutedText}
                />
              </Pressable>
            ) : null}
          </View>
        );
      })}
      <CategorySelector
        title={EntryRegistrationCopy.categoryLabel}
        bookId={bookId}
        categories={CATEGORY_OPTIONS[draft.type]}
        entryType={draft.type}
        selectedCategoryId={draft.categoryId}
        onSelectCategory={(category) => {
          if (!editing && category?.id === AssetLinkConfig.loanCategoryId)
            update("installmentMonths", ONE_TIME_INSTALLMENT_MONTHS);
          update("category", category?.label ?? "");
          update("categoryId", category?.id ?? "");
        }}
      />
      <View style={styles.detailsSection}>
        <EntryAssetLinkFields
          composer={composer}
          bookId={bookId}
          visible={visible}
          disabled={disabled}
          editingEntryId={editingEntryId}
        />
        <Text accessibilityRole="header" style={styles.label}>
          {Copy.details}
        </Text>
        <EntryComposerDetails
          composer={composer}
          editing={editing}
          onConvert={onConvert}
          showDate={false}
        />
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    toolbar: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      columnGap: AppLayout.cardGap,
    },
    typeControl: { width: Ui.sheetTypePickerWidth, maxWidth: "100%" },
    form: { gap: Ui.sheetSectionGap },
    detailsSection: { paddingTop: Ui.detailsSectionTopPadding, gap: Ui.detailsHeadingGap },
    label: getFormLabelTextStyle(),
    input: {
      ...getUnderlineFormInputTextStyle(),
      flex: 1,
      minWidth: 0,
      borderBottomWidth: 0,
      minHeight: Ui.sheetTextFieldHeight,
      fontSize: Ui.sheetFieldFontSize,
      lineHeight: Ui.sheetFieldLineHeight,
      paddingVertical: Ui.sheetTextFieldVerticalPadding,
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: AppLayout.cardGap,
      borderBottomWidth: AppLayout.dividerWidth,
      borderBottomColor: getAppColors().border,
    },
    inputAction: {
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      minWidth: Ui.sheetFieldHeight,
      minHeight: Ui.sheetTextFieldHeight,
    },
  }),
);
