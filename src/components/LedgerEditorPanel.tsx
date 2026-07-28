import { StyleSheet, View } from "react-native";

import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { LedgerEntryForm } from "./LedgerEntryForm";

type LedgerEditorPanelProps = {
  activeBookId?: string | null;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  members: LedgerBookMember[];
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onChangeInstallmentMonths: (installmentMonths: number) => void;
  onPickPhotoAttachments: () => void | Promise<void>;
  onRemovePhotoAttachment: (attachmentId: string) => void;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
  onSettleInstallmentEntry?: (() => void | Promise<void>) | null;
  showInstallmentSettleAction?: boolean;
};

export function LedgerEditorPanel(props: LedgerEditorPanelProps) {
  return (
    <View style={styles.container}>
      <LedgerEntryForm
        activeBookId={props.activeBookId}
        draft={props.draft}
        editingEntryId={props.editingEntryId}
        members={props.members}
        onChangeDraft={props.onChangeDraft}
        onChangeInstallmentMonths={props.onChangeInstallmentMonths}
        onPickPhotoAttachments={props.onPickPhotoAttachments}
        onRemovePhotoAttachment={props.onRemovePhotoAttachment}
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
