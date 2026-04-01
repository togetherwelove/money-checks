import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { LedgerEntryForm } from "./LedgerEntryForm";

type LedgerEditorPanelProps = {
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onCancelEdit: () => void;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onSaveEntry: () => void;
  onSelectType: (type: LedgerEntryType) => void;
};

export function LedgerEditorPanel(props: LedgerEditorPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{AppMessages.editorTitle}</Text>
      <LedgerEntryForm
        draft={props.draft}
        editingEntryId={props.editingEntryId}
        onCancelEdit={props.onCancelEdit}
        onChangeDraft={props.onChangeDraft}
        onSaveEntry={props.onSaveEntry}
        onSelectType={props.onSelectType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 10,
  },
  title: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
