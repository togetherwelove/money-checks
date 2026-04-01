import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CategorySelector } from "../components/CategorySelector";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { formatAmountInput } from "../utils/amount";
import { ActionButton } from "./ActionButton";

type LedgerEntryFormProps = {
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onCancelEdit: () => void;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onSaveEntry: () => void;
  onSelectType: (type: LedgerEntryType) => void;
};

export function LedgerEntryForm({
  draft,
  editingEntryId,
  onCancelEdit,
  onChangeDraft,
  onSaveEntry,
  onSelectType,
}: LedgerEntryFormProps) {
  const categories = CATEGORY_OPTIONS[draft.type];

  return (
    <View style={styles.form}>
      <View style={styles.typeRow}>
        <TypeButton
          isActive={draft.type === "income"}
          label={AppMessages.editorTypeIncome}
          onPress={() => onSelectType("income")}
        />
        <TypeButton
          isActive={draft.type === "expense"}
          label={AppMessages.editorTypeExpense}
          onPress={() => onSelectType("expense")}
        />
      </View>
      <TextInput
        keyboardType="number-pad"
        onChangeText={(value) => onChangeDraft("amount", value)}
        placeholder={AppMessages.editorAmount}
        style={styles.input}
        value={formatAmountInput(draft.amount)}
      />
      <CategorySelector
        categories={categories}
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
        <ActionButton label={AppMessages.editorCancel} onPress={onCancelEdit} />
      </View>
    </View>
  );
}

function TypeButton({
  isActive,
  label,
  onPress,
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.typeButton, isActive && styles.activeTypeButton]}>
      <Text style={[styles.typeButtonText, isActive && styles.activeTypeButtonText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 8,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
  },
  activeTypeButton: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  typeButtonText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  activeTypeButtonText: {
    color: AppColors.primary,
    fontWeight: "700",
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
    flexDirection: "row",
    gap: 8,
  },
});
