import { useEffect, useRef } from "react";
import { InteractionManager, StyleSheet, Text, TextInput, View } from "react-native";

import { CategorySelector } from "../components/CategorySelector";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { LedgerEntryFormUi } from "../constants/ledgerEntryForm";
import { AppMessages } from "../constants/messages";
import { FormInputTextStyle, FormLabelTextStyle, SurfaceCardStyle } from "../constants/uiStyles";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { formatAmountInput } from "../utils/amount";
import { ActionButton } from "./ActionButton";
import { EntryDirectionSelector } from "./EntryDirectionSelector";

type LedgerEntryFormProps = {
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onCategoryDraggingChange?: (isDragging: boolean) => void;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
};

export function LedgerEntryForm({
  draft,
  editingEntryId,
  onChangeDraft,
  onCategoryDraggingChange,
  onSaveEntry,
  onSelectType,
}: LedgerEntryFormProps) {
  const categories = CATEGORY_OPTIONS[draft.type];
  const amountInputRef = useRef<TextInput>(null);
  const amountFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const interactionTask = InteractionManager.runAfterInteractions(() => {
      amountFocusTimeoutRef.current = setTimeout(() => {
        if (!isCancelled) {
          amountInputRef.current?.focus();
        }
      }, LedgerEntryFormUi.amountFocusDelayMs);
    });

    return () => {
      isCancelled = true;
      if (amountFocusTimeoutRef.current) {
        clearTimeout(amountFocusTimeoutRef.current);
      }
      interactionTask.cancel();
    };
  }, []);

  return (
    <View style={styles.form}>
      <EntryDirectionSelector onSelectType={onSelectType} selectedType={draft.type} />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{AppMessages.editorAmount}</Text>
        <TextInput
          ref={amountInputRef}
          blurOnSubmit
          keyboardType="number-pad"
          onChangeText={(value) => onChangeDraft("amount", value)}
          placeholder={AppMessages.editorAmount}
          returnKeyType="done"
          style={[styles.input, styles.amountInput]}
          value={formatAmountInput(draft.amount)}
        />
      </View>
      <CategorySelector
        categories={categories}
        entryType={draft.type}
        onDraggingChange={onCategoryDraggingChange}
        onSelectCategory={(category) => onChangeDraft("category", category)}
        selectedCategory={draft.category}
        title={AppMessages.editorCategory}
      />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{AppMessages.editorNote}</Text>
        <TextInput
          multiline
          onChangeText={(value) => onChangeDraft("note", value)}
          placeholder={AppMessages.editorNote}
          style={[styles.input, styles.noteInput]}
          textAlignVertical="top"
          value={draft.note}
        />
      </View>
      <View style={styles.formActions}>
        <ActionButton
          label={editingEntryId ? AppMessages.editorUpdate : AppMessages.editorNewEntry}
          onPress={onSaveEntry}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    ...SurfaceCardStyle,
    gap: AppLayout.cardGap,
  },
  fieldGroup: {
    gap: 6,
  },
  label: FormLabelTextStyle,
  input: FormInputTextStyle,
  amountInput: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  noteInput: {
    minHeight: 88,
  },
  formActions: {
    paddingTop: 4,
  },
});
