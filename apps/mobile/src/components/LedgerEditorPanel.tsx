import { StyleSheet, View } from "react-native";

import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { LedgerEntryForm } from "./LedgerEntryForm";

type LedgerEditorPanelProps = {
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onSaveEntry: () => void;
  onSelectType: (type: LedgerEntryType) => void;
};

export function LedgerEditorPanel(props: LedgerEditorPanelProps) {
  return (
    <View style={styles.container}>
      <LedgerEntryForm
        draft={props.draft}
        editingEntryId={props.editingEntryId}
        onChangeDraft={props.onChangeDraft}
        onSaveEntry={props.onSaveEntry}
        onSelectType={props.onSelectType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 2,
  },
});
