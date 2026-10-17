import { StyleSheet, Text, View } from "react-native";

import { CardSmsClipboardCopy as Copy } from "../../constants/cardSmsClipboard";
import { AppColors } from "../../constants/colors";
import { EntryComposerUi } from "../../constants/entryComposer";
import { AppLayout } from "../../constants/layout";
import type { CardSmsClipboardDraft } from "../../lib/cardSmsClipboardImport";
import { formatCurrency } from "../../utils/calendar";
import { ActionButton } from "../ActionButton";
import { IconActionButton } from "../IconActionButton";

type Props = {
  draft: CardSmsClipboardDraft;
  onApply: () => void;
  onDismiss: () => void;
};

export function ClipboardEntrySuggestion({ draft, onApply, onDismiss }: Props) {
  const preview = [Copy.suggestionLabel, formatCurrency(Number(draft.amount)), draft.content].join(Copy.previewSeparator);
  return (
    <View style={styles.row}>
      <Text accessibilityLabel={preview} numberOfLines={1} style={styles.preview}>{preview}</Text>
      <ActionButton label={Copy.applyAction} size="inline" onPress={onApply} />
      <IconActionButton icon="x" size="compact" accessibilityLabel={Copy.dismissSuggestion} onPress={onDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
  preview: { flex: 1, color: AppColors.mutedText, fontSize: EntryComposerUi.summaryFontSize },
});
