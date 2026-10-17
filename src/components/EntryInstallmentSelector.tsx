import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EntryDetailLabelStyle, EntryDetailValueStyle, EntryDetailRowStyle, EntryDetailDividerStyle } from "../constants/entryDetailStyles";
import { AppColors } from "../constants/colors";
import {
  EntryInstallmentSelectorUi,
  EntryRegistrationCopy,
} from "../constants/entryRegistration";
import {
  SettingValueActionStyle,
} from "../constants/uiStyles";
import { formatInstallmentLabel } from "../lib/installments";

type EntryInstallmentSelectorProps = {
  installmentMonths: number;
  onPress: () => void;
};

export function EntryInstallmentSelector({
  installmentMonths,
  onPress,
}: EntryInstallmentSelectorProps) {
  return (
    <Pressable
      accessibilityLabel={EntryRegistrationCopy.paymentMethodAccessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
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
  );
}

const styles = StyleSheet.create({
  label: EntryDetailLabelStyle,
  pressedRow: {
    opacity: EntryInstallmentSelectorUi.pressedOpacity,
  },
  row: {
    ...EntryDetailRowStyle,
    ...EntryDetailDividerStyle,
  },
  value: EntryDetailValueStyle,
  valueAction: SettingValueActionStyle,
});
