import { Button, Host, Image, Picker, ProgressView, Text } from "@expo/ui/swift-ui";
import {
  accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, disabled,
  frame, glassEffect, labelStyle, pickerStyle, tag, tint,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { StyleSheet, Text as HeaderTitle, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui } from "../../constants/entryComposer";
import { AppLayout } from "../../constants/layout";
import type { LedgerEntryType } from "../../types/ledger";
import type { EntryComposerHeaderProps } from "./EntryComposerHeader.types";

const supportsGlass = isLiquidGlassAvailable();
const buttonFrame = frame({ width: Ui.sheetControlSize, height: Ui.sheetControlSize });
const pickerGlass = supportsGlass
  ? [glassEffect({ glass: { variant: "regular", interactive: false }, shape: "capsule" })]
  : [];
const closeGlass = supportsGlass
  ? [glassEffect({ glass: { variant: "regular", interactive: true }, shape: "circle" })]
  : [];
const actionGlass = supportsGlass
  ? [glassEffect({ glass: { variant: "regular", interactive: true, tint: AppColors.primary }, shape: "circle" })]
  : [];

export function EntryComposerHeader({ title, type = "expense", onSelectType, typeDisabled = false, saving = false, actionDisabled = false, actionLabel, onAction, onClose }: EntryComposerHeaderProps) {
  return <View style={styles.header}>
    <Host style={styles.button} colorScheme="light" alignment="center">
      <Button role="cancel"
        onPress={() => { if (!saving) onClose(); }}
        modifiers={[buttonStyle(supportsGlass ? "plain" : "bordered"), buttonBorderShape("circle"), controlSize("large"),
          buttonFrame, ...closeGlass,
          labelStyle("iconOnly"), disabled(saving), tint(AppColors.text),
          accessibilityLabel(Copy.closeSheet)]}>
        <Image systemName="xmark" size={Ui.sheetIconSize} color={AppColors.text} modifiers={[buttonFrame]} />
      </Button>
    </Host>
    {title ? <HeaderTitle accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</HeaderTitle>
      : <Host style={styles.picker} colorScheme="light" alignment="center">
      <Picker<LedgerEntryType> label={Copy.typeLabel} selection={type}
        onSelectionChange={value => { if (!typeDisabled) onSelectType?.(value); }}
        modifiers={[pickerStyle("segmented"), controlSize("large"),
          ...pickerGlass, disabled(typeDisabled)]}>
        <Text modifiers={[tag("expense")]}>{Copy.expense}</Text>
        <Text modifiers={[tag("income")]}>{Copy.income}</Text>
      </Picker>
    </Host>}
    {onAction ? <Host style={styles.button} colorScheme="light" alignment="center">
      <Button onPress={() => { if (!actionDisabled && !saving) onAction(); }}
        modifiers={[buttonStyle(supportsGlass ? "plain" : "borderedProminent"), buttonBorderShape("circle"), controlSize("large"),
          buttonFrame, ...actionGlass,
          labelStyle("iconOnly"), disabled(actionDisabled || saving), tint(AppColors.primary),
          accessibilityLabel(actionLabel ?? Copy.save)]}>
        {saving ? <ProgressView modifiers={[buttonFrame]} />
          : <Image systemName="checkmark" size={Ui.sheetIconSize} color={AppColors.inverseText} modifiers={[buttonFrame]} />}
      </Button>
    </Host> : <View style={styles.button} />}
  </View>;
}

const styles = StyleSheet.create({
  title: { flex: 1, textAlign: "center", color: AppColors.text, fontSize: Ui.sheetFieldFontSize, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: AppLayout.cardGap, padding: Ui.sheetPadding },
  button: { width: Ui.sheetControlSize, height: Ui.sheetControlSize },
  picker: { flex: 1, height: Ui.sheetControlSize },
});
