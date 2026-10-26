import { Feather } from "./AppIcons";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import { useMemo } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

import { EntryDetailLabelStyle, EntryDetailValueStyle, EntryDetailRowStyle } from "../constants/entryDetailStyles";
import { AppColors } from "../constants/colors";
import {
  EntryInstallmentSelectorUi,
  EntryRegistrationCopy,
} from "../constants/entryRegistration";
import {
  SettingValueActionStyle,
} from "../constants/uiStyles";
import { formatInstallmentLabel } from "../lib/installments";
import { InstallmentPickerConfig as Config, InstallmentPickerCopy } from "../constants/installmentPicker";
import { ONE_TIME_INSTALLMENT_MONTHS } from "../utils/ledgerEntries";

const presetMonths = Array.from({ length: Config.presetMaxMonths }, (_, index) => index + ONE_TIME_INSTALLMENT_MONTHS);

type EntryInstallmentSelectorProps = {
  installmentMonths: number;
  onRequestCustom: () => void;
  onSelectInstallmentMonths: (months: number) => void;
};

export function EntryInstallmentSelector({
  installmentMonths,
  onRequestCustom,
  onSelectInstallmentMonths,
}: EntryInstallmentSelectorProps) {
  const actions = useMemo<MenuAction[]>(() => [
    ...presetMonths.map(months => ({ id: String(months), title: formatInstallmentLabel(months),
      state: months === installmentMonths ? "on" as const : "off" as const })),
    { id: Config.customValue, title: InstallmentPickerCopy.customLabel,
      state: installmentMonths > Config.presetMaxMonths ? "on" : "off" },
  ], [installmentMonths]);
  return (
    <MenuView actions={actions} onOpenMenu={() => Keyboard.dismiss()}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === Config.customValue) { onRequestCustom(); return; }
        const months = presetMonths.find(month => String(month) === nativeEvent.event);
        if (months !== undefined) onSelectInstallmentMonths(months);
      }}>
    <Pressable
      accessibilityLabel={EntryRegistrationCopy.paymentMethodAccessibilityLabel}
      accessibilityRole="button"
      accessibilityValue={{ text: formatInstallmentLabel(installmentMonths) }}
      style={({ pressed }) => [
        styles.row,
        pressed ? styles.pressedRow : null,
      ]}
    >
      <Text style={styles.label}>{EntryRegistrationCopy.paymentMethodLabel}</Text>
      <View style={styles.valueAction}>
        <Text style={styles.value}>{formatInstallmentLabel(installmentMonths)}</Text>
        <Feather
          color={AppColors.mutedStrongText}
          name="chevron-down"
          size={EntryInstallmentSelectorUi.iconSize}
        />
      </View>
    </Pressable>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  label: EntryDetailLabelStyle,
  pressedRow: {
    opacity: EntryInstallmentSelectorUi.pressedOpacity,
  },
  row: {
    ...EntryDetailRowStyle,
  },
  value: EntryDetailValueStyle,
  valueAction: SettingValueActionStyle,
});
