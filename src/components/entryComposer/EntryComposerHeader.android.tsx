import {
  CircularProgressIndicator, FilledIconButton, Host, Icon, IconButton,
  SegmentedButton, SingleChoiceSegmentedButtonRow, Text,
} from "@expo/ui/jetpack-compose";
import { semantics, size } from "@expo/ui/jetpack-compose/modifiers";
import { StyleSheet, Text as HeaderTitle, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui } from "../../constants/entryComposer";
import { AppLayout } from "../../constants/layout";
import { useExpenseTextColor } from "../../contexts/ExpenseTextColorContext";
import type { EntryComposerHeaderProps } from "./EntryComposerHeader.types";

const closeIcon = require("../../../assets/native-icons/close.xml");
const checkIcon = require("../../../assets/native-icons/check.xml");

export function EntryComposerHeader({ title, type = "expense", onSelectType, typeDisabled = false, saving = false, actionDisabled = false, actionLabel, onAction, onClose }: EntryComposerHeaderProps) {
  const { textColor } = useExpenseTextColor();
  return <View style={styles.header}>
    <Host style={styles.button} colorScheme="light">
      <IconButton enabled={!saving} onClick={() => { if (!saving) onClose(); }}>
        <Icon source={closeIcon} size={Ui.sheetIconSize} contentDescription={Copy.closeSheet} />
      </IconButton>
    </Host>
    {title ? <HeaderTitle accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</HeaderTitle>
      : <Host style={styles.picker} colorScheme="light" seedColor={AppColors.primary}>
      <SingleChoiceSegmentedButtonRow>
        <SegmentedButton selected={type === "expense"} enabled={!typeDisabled}
          onClick={() => { if (!typeDisabled) onSelectType?.("expense"); }}>
          <SegmentedButton.Label><Text style={styles.segmentLabel} color={textColor}>{Copy.expense}</Text></SegmentedButton.Label>
        </SegmentedButton>
        <SegmentedButton selected={type === "income"} enabled={!typeDisabled}
          onClick={() => { if (!typeDisabled) onSelectType?.("income"); }}>
          <SegmentedButton.Label><Text style={styles.segmentLabel} color={AppColors.income}>{Copy.income}</Text></SegmentedButton.Label>
        </SegmentedButton>
      </SingleChoiceSegmentedButtonRow>
    </Host>}
    {onAction ? <Host style={styles.button} colorScheme="light" seedColor={AppColors.primary}>
      <FilledIconButton enabled={!actionDisabled && !saving}
        modifiers={[semantics({ contentDescription: actionLabel })]}
        onClick={() => { if (!actionDisabled && !saving) onAction(); }}>
        {saving ? <CircularProgressIndicator modifiers={[size(Ui.sheetIconSize, Ui.sheetIconSize)]} />
          : <Icon source={checkIcon} size={Ui.sheetIconSize} contentDescription={actionLabel} />}
      </FilledIconButton>
    </Host> : <View style={styles.button} />}
  </View>;
}

const styles = StyleSheet.create({
  segmentLabel: { fontSize: Ui.sheetSegmentFontSize },
  title: { flex: 1, textAlign: "center", color: AppColors.text, fontSize: Ui.sheetFieldFontSize, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: AppLayout.cardGap, padding: Ui.sheetPadding },
  button: { width: Ui.sheetControlSize, height: Ui.sheetControlSize },
  picker: { flex: 1, height: Ui.sheetControlSize },
});
