import { StyleSheet, TextInput, View } from "react-native";

import { CategorySelector } from "../components/CategorySelector";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { AppColors } from "../constants/colors";
import { DisabledAutofillProps } from "../constants/inputAutofill";
import { AppMessages } from "../constants/messages";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { formatAmountInput } from "../utils/amount";
import { ActionButton } from "./ActionButton";
import { EntryDirectionSelector } from "./EntryDirectionSelector";

type LedgerEntryFormProps = {
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
};

export function LedgerEntryForm({
  draft,
  editingEntryId,
  onChangeDraft,
  onSaveEntry,
  onSelectType,
}: LedgerEntryFormProps) {
  const categories = CATEGORY_OPTIONS[draft.type];

  return (
    <View style={styles.form}>
      <EntryDirectionSelector onSelectType={onSelectType} selectedType={draft.type} />
      <TextInput
        {...DisabledAutofillProps}
        keyboardType="number-pad"
        onChangeText={(value) => onChangeDraft("amount", value)}
        placeholder={AppMessages.editorAmount}
        style={styles.input}
        value={formatAmountInput(draft.amount)}
      />
      <CategorySelector
        categories={categories}
        entryType={draft.type}
        onSelectCategory={(category) => onChangeDraft("category", category)}
        selectedCategory={draft.category}
        title={AppMessages.editorCategory}
      />
      <TextInput
        onChangeText={(value) => onChangeDraft("note", value)}
        placeholder={AppMessages.editorNote}
        style={styles.input}
        value={draft.note}
      />
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
    gap: 8,
  },
  input: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: AppColors.border,
    color: AppColors.text,
    fontSize: 16,
  },
  formActions: {
    paddingTop: 4,
  },
});
