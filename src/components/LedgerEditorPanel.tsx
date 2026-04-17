import { StyleSheet, View } from "react-native";

import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import { LedgerEntryForm } from "./LedgerEntryForm";

type LedgerEditorPanelProps = {
  canQueueEntry?: boolean;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onChangeInstallmentMonths: (installmentMonths: number) => void;
  onPickPhotoAttachments: () => void | Promise<void>;
  onCategorySelected?: (() => void) | null;
  onCategoryDraggingChange?: (isDragging: boolean) => void;
  onRemovePhotoAttachment: (attachmentId: string) => void;
  onQueueEntry?: (() => void | Promise<void>) | null;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
  onSettleInstallmentEntry?: (() => void | Promise<void>) | null;
  showInstallmentSettleAction?: boolean;
};

export function LedgerEditorPanel(props: LedgerEditorPanelProps) {
  return (
    <View style={styles.container}>
      <LedgerEntryForm
        canQueueEntry={props.canQueueEntry}
        draft={props.draft}
        editingEntryId={props.editingEntryId}
        onChangeDraft={props.onChangeDraft}
        onChangeInstallmentMonths={props.onChangeInstallmentMonths}
        onPickPhotoAttachments={props.onPickPhotoAttachments}
        onCategorySelected={props.onCategorySelected}
        onCategoryDraggingChange={props.onCategoryDraggingChange}
        onRemovePhotoAttachment={props.onRemovePhotoAttachment}
        onQueueEntry={props.onQueueEntry}
        onSaveEntry={props.onSaveEntry}
        onSelectType={props.onSelectType}
        onSettleInstallmentEntry={props.onSettleInstallmentEntry}
        showInstallmentSettleAction={props.showInstallmentSettleAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
});
