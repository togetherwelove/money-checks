import { StyleSheet, View } from "react-native";

import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { LedgerEntryForm } from "./LedgerEntryForm";

type LedgerEditorPanelProps = {
  canQueueEntry?: boolean;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onCategoryDraggingChange?: (isDragging: boolean) => void;
  onQueueEntry?: (() => void | Promise<void>) | null;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
};

export function LedgerEditorPanel(props: LedgerEditorPanelProps) {
  return (
    <View style={styles.container}>
      <LedgerEntryForm
        canQueueEntry={props.canQueueEntry}
        draft={props.draft}
        editingEntryId={props.editingEntryId}
        onChangeDraft={props.onChangeDraft}
        onCategoryDraggingChange={props.onCategoryDraggingChange}
        onQueueEntry={props.onQueueEntry}
        onSaveEntry={props.onSaveEntry}
        onSelectType={props.onSelectType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
});
