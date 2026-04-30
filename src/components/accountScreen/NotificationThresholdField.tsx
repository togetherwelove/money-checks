import { StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { NotificationThresholdAmountCopy } from "../../notifications/config/notificationCopy";
import type { NotificationThresholdField as NotificationThresholdFieldState } from "../../notifications/preferences/notificationPreferences";
import { formatAmountInput } from "../../utils/amount";

type NotificationThresholdFieldProps = {
  field: NotificationThresholdFieldState;
  isFirst?: boolean;
  labelWidth?: number;
  onChangeEnabled: (enabled: boolean) => void;
  onMeasureLabel?: (width: number) => void;
  onChangeValue: (value: string) => void;
};

export function NotificationThresholdField({
  field,
  isFirst = false,
  labelWidth,
  onChangeEnabled,
  onMeasureLabel,
  onChangeValue,
}: NotificationThresholdFieldProps) {
  return (
    <View style={[styles.field, isFirst && styles.firstField]}>
      <View style={styles.inputWrap}>
        <Text
          onLayout={(event) => onMeasureLabel?.(event.nativeEvent.layout.width)}
          style={[styles.label, labelWidth ? { width: labelWidth } : null]}
        >
          {field.label}
        </Text>
        <TextInput
          editable={field.enabled}
          inputMode="numeric"
          keyboardType="numeric"
          onChangeText={onChangeValue}
          placeholder={NotificationThresholdAmountCopy.placeholder}
          style={[styles.input, !field.enabled && styles.disabledInput]}
          value={formatAmountInput(field.value)}
        />
        <Text style={styles.currency}>{NotificationThresholdAmountCopy.currencyLabel}</Text>
        <Text style={styles.label}>초과 시</Text>
      </View>
      <Switch
        onValueChange={onChangeEnabled}
        thumbColor={field.enabled ? AppColors.inverseText : AppColors.surface}
        trackColor={{ false: AppColors.border, true: AppColors.primary }}
        value={field.enabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  firstField: {
    borderTopWidth: 0,
  },
  label: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  inputWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  currency: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
    paddingEnd: 4,
  },
  input: {
    backgroundColor: "transparent",
    borderBottomColor: AppColors.border,
    borderBottomWidth: 1,
    borderCurve: "continuous",
    borderRadius: 0,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "600",
    height: 36,
    minWidth: 75,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  disabledInput: {
    color: AppColors.mutedText,
  },
});
