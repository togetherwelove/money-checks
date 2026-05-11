import { StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { CurrencyUnitLabels } from "../../constants/currency";
import { AppTextBreakProps } from "../../constants/textLayout";
import { resolveDisplayCurrency } from "../../lib/currencyPreference";
import { NotificationThresholdAmountCopy } from "../../notifications/config/notificationCopy";
import { NotificationThresholdAmountInput } from "../../notifications/config/notificationThresholdLimits";
import type { NotificationThresholdField as NotificationThresholdFieldState } from "../../notifications/preferences/notificationPreferences";
import { formatAmountInput } from "../../utils/amount";

type NotificationThresholdFieldProps = {
  field: NotificationThresholdFieldState;
  isFirst?: boolean;
  onChangeEnabled: (enabled: boolean) => void;
  onChangeValue: (value: string) => void;
};

export function NotificationThresholdField({
  field,
  isFirst = false,
  onChangeEnabled,
  onChangeValue,
}: NotificationThresholdFieldProps) {
  const currencyUnitLabel = CurrencyUnitLabels[resolveDisplayCurrency()];

  return (
    <View style={[styles.field, isFirst && styles.firstField]}>
      <View style={styles.inputWrap}>
        <Text {...AppTextBreakProps} style={[styles.label, styles.periodLabel]}>
          {field.label}
        </Text>
        <TextInput
          editable={field.enabled}
          inputMode="numeric"
          keyboardType="numeric"
          maxLength={NotificationThresholdAmountInput.maxFormattedLength}
          onChangeText={onChangeValue}
          placeholder={NotificationThresholdAmountCopy.placeholder}
          style={[styles.input, !field.enabled && styles.disabledInput]}
          value={formatAmountInput(field.value)}
        />
        <Text {...AppTextBreakProps} style={styles.currency}>
          {currencyUnitLabel}
        </Text>
        <Text {...AppTextBreakProps} style={styles.label}>
          {NotificationThresholdAmountCopy.exceededLabel}
        </Text>
      </View>
      <View style={styles.switchWrap}>
        <Switch
          onValueChange={onChangeEnabled}
          thumbColor={field.enabled ? AppColors.inverseText : AppColors.surface}
          trackColor={{ false: AppColors.border, true: AppColors.primary }}
          value={field.enabled}
        />
      </View>
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
  periodLabel: {
    width: NotificationThresholdAmountInput.periodLabelWidth,
  },
  inputWrap: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    minWidth: 0,
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
    width: NotificationThresholdAmountInput.inputWidth,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  disabledInput: {
    color: AppColors.mutedText,
  },
  switchWrap: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
});
