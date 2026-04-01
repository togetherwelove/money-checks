import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import type { NotificationThresholdField as NotificationThresholdFieldState } from "../../notifications/preferences/notificationPreferences";
import { formatAmountInput } from "../../utils/amount";

type NotificationThresholdFieldProps = {
  field: NotificationThresholdFieldState;
  onChangePeriod: (period: NotificationThresholdFieldState["selectedPeriod"]) => void;
  onChangeValue: (value: string) => void;
};

export function NotificationThresholdField({
  field,
  onChangePeriod,
  onChangeValue,
}: NotificationThresholdFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      <View style={styles.periodBlock}>
        <Text style={styles.periodLabel}>{field.periodLabel}</Text>
        <View style={styles.periodOptions}>
          {field.periodOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => onChangePeriod(option.value)}
              style={[
                styles.periodOption,
                field.selectedPeriod === option.value && styles.activePeriodOption,
              ]}
            >
              <Text
                style={[
                  styles.periodOptionText,
                  field.selectedPeriod === option.value && styles.activePeriodOptionText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <TextInput
        inputMode="numeric"
        keyboardType="numeric"
        onChangeText={onChangeValue}
        placeholder="0"
        style={styles.input}
        value={formatAmountInput(field.value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  periodBlock: {
    gap: 6,
  },
  periodLabel: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  periodOptions: {
    flexDirection: "row",
    gap: 6,
  },
  periodOption: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
  },
  periodOptionText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  activePeriodOption: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  activePeriodOptionText: {
    color: AppColors.primary,
    fontWeight: "700",
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    backgroundColor: AppColors.background,
    color: AppColors.text,
    fontSize: 16,
    textAlign: "right",
  },
});
