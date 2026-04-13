import { useEffect, useRef } from "react";
import { InteractionManager, Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { CategorySelector } from "../components/CategorySelector";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { AppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { LedgerEntryFormUi } from "../constants/ledgerEntryForm";
import { AppMessages } from "../constants/messages";
import { FormInputTextStyle, FormLabelTextStyle, SurfaceCardStyle } from "../constants/uiStyles";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { formatAmountInput } from "../utils/amount";
import { canSubmitDraft } from "../utils/ledgerEntries";
import { ActionButton } from "./ActionButton";
import { EntryDirectionSelector } from "./EntryDirectionSelector";

type LedgerEntryFormProps = {
  canQueueEntry?: boolean;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onCategoryDraggingChange?: (isDragging: boolean) => void;
  onQueueEntry?: (() => void | Promise<void>) | null;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
};

export function LedgerEntryForm({
  canQueueEntry = false,
  draft,
  editingEntryId,
  onChangeDraft,
  onCategoryDraggingChange,
  onQueueEntry = null,
  onSaveEntry,
  onSelectType,
}: LedgerEntryFormProps) {
  const categories = CATEGORY_OPTIONS[draft.type];
  const amountInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const amountFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSubmit = canSubmitDraft(draft);

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
          submitBehavior="blurAndSubmit"
          keyboardType="number-pad"
          onChangeText={(value) => onChangeDraft("amount", value)}
          onSubmitEditing={() => contentInputRef.current?.focus()}
          placeholder={AppMessages.editorAmount}
          returnKeyType="next"
          style={styles.input}
          value={formatAmountInput(draft.amount)}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EntryRegistrationCopy.contentLabel}</Text>
        <TextInput
          ref={contentInputRef}
          submitBehavior="blurAndSubmit"
          onChangeText={(value) => onChangeDraft("content", value)}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder={EntryRegistrationCopy.contentPlaceholder}
          returnKeyType="done"
          style={styles.input}
          value={draft.content}
        />
      </View>
      <CategorySelector
        categories={categories}
        entryType={draft.type}
        onDraggingChange={onCategoryDraggingChange}
        onSelectCategory={(category) => {
          onChangeDraft("category", category);
          setTimeout(() => {
            noteInputRef.current?.focus();
          }, LedgerEntryFormUi.noteFocusDelayMs);
        }}
        selectedCategory={draft.category}
        title={EntryRegistrationCopy.categoryLabel}
      />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EntryRegistrationCopy.noteLabel}</Text>
        <TextInput
          ref={noteInputRef}
          submitBehavior="blurAndSubmit"
          multiline
          onChangeText={(value) => onChangeDraft("note", value)}
          placeholder={EntryRegistrationCopy.noteLabel}
          returnKeyType="done"
          style={styles.input}
          textAlignVertical="top"
          value={draft.note}
        />
      </View>
      <View style={styles.formActions}>
        {!editingEntryId && onQueueEntry ? (
          <ActionButton
            disabled={!canQueueEntry}
            label={EntryRegistrationCopy.addEntryAction}
            onPress={onQueueEntry}
            variant="secondary"
          />
        ) : null}
        <ActionButton
          disabled={!canSubmit}
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
  formActions: {
    paddingTop: 4,
    gap: 8,
  },
});
