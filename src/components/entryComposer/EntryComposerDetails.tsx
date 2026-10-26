import { useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui } from "../../constants/entryComposer";
import { EntryRegistrationCopy } from "../../constants/entryRegistration";
import { EntryDetailFieldStyle, EntryDetailLabelStyle, EntryDetailValueStyle, EntryDetailHintStyle, EntryDetailRowStyle } from "../../constants/entryDetailStyles";
import { formatInstallmentLabel } from "../../lib/installments";
import type { useEntryComposer } from "../../hooks/useEntryComposer";
import { EntryDateSelector } from "../EntryDateSelector";
import { EntryInstallmentSelector } from "../EntryInstallmentSelector";
import { EntryTargetMemberSelector } from "../EntryTargetMemberSelector";
import { EntryPhotoAttachmentField } from "../EntryPhotoAttachmentField";
import { InstallmentPickerModal } from "../InstallmentPickerModal";
import { ActionButton } from "../ActionButton";
import { InstallmentConversionCopy } from "../../constants/installmentConversion";

export function EntryComposerDetails({ composer, editing = false, onConvert, showDate = true }: {
  composer: ReturnType<typeof useEntryComposer>; editing?: boolean; onConvert?: () => void;
  showDate?: boolean;
}) {
  const [installmentOpen, setInstallmentOpen] = useState(false);
  const { draft, members, update, pickPhotos } = composer;
  return (
    <View style={styles.sections}>
      {showDate ? <View style={styles.card}>
        <EntryDateSelector selectedDate={draft.date} onSelectDate={(date) => update("date", date)} />
      </View> : null}
      <View style={styles.card}>
      {editing ? <View style={styles.paymentInfo}>
        <View style={styles.paymentRow}>
          <Text style={styles.label}>{EntryRegistrationCopy.paymentMethodLabel}</Text>
          <Text style={styles.value}>{formatInstallmentLabel(draft.installmentMonths)}</Text>
        </View>
        {onConvert ? <ActionButton label={InstallmentConversionCopy.action} onPress={onConvert} size="inline" /> : <Text style={styles.hint}>{Copy.paymentReadOnly}</Text>}
      </View> : <EntryInstallmentSelector installmentMonths={draft.installmentMonths}
        onSelectInstallmentMonths={months => update("installmentMonths", months)} onRequestCustom={() => {
        Keyboard.dismiss();
        setInstallmentOpen(true);
      }} />}
      <InstallmentPickerModal isOpen={installmentOpen} installmentMonths={draft.installmentMonths}
        onClose={() => setInstallmentOpen(false)} onSelectInstallmentMonths={(months) => update("installmentMonths", months)} />
      </View>
      {members.length > 1 ? <View style={styles.card}><EntryTargetMemberSelector
        members={members} selectedMemberId={draft.targetMemberId}
        onSelectMember={(member) => { update("targetMemberId", member.userId); update("targetMemberName", member.displayName); }}
      /></View> : null}
      <View style={styles.card}>
      <EntryPhotoAttachmentField attachments={draft.photoAttachments} onPickAttachments={() => { void pickPhotos(); }}
        onRemoveAttachment={(id) => update("photoAttachments", draft.photoAttachments.filter((photo) => (photo.id ?? photo.uri) !== id))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: Ui.sheetSectionGap },
  card: { backgroundColor: AppColors.surfaceMuted, borderRadius: Ui.sheetCardRadius, padding: Ui.detailsPadding, gap: Ui.detailsSectionGap },
  paymentInfo: EntryDetailFieldStyle,
  paymentRow: EntryDetailRowStyle,
  label: EntryDetailLabelStyle,
  value: EntryDetailValueStyle,
  hint: EntryDetailHintStyle,
});
