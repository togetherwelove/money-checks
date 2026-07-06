import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ActionButton } from "../ActionButton";
import { AppColors } from "../../constants/colors";
import { CurrencyUnitLabels } from "../../constants/currency";
import { AppTextBreakProps } from "../../constants/textLayout";
import { ModalActionRowStyle } from "../../constants/uiStyles";
import { resolveDisplayCurrency } from "../../lib/currencyPreference";
import {
  NotificationThresholdAmountCopy,
  NotificationUiCopy,
} from "../../notifications/config/notificationCopy";
import { NotificationThresholdAmountInput } from "../../notifications/config/notificationThresholdLimits";
import type {
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../../notifications/domain/notificationEvents";
import type { NotificationThresholdSettings } from "../../notifications/preferences/notificationPreferences";
import { formatAmountInput } from "../../utils/amount";

type NotificationThresholdFieldProps = {
  onChangePeriod: (period: NotificationThresholdPeriod) => void;
  onChangeValue: (value: string) => void;
  onToggleEnabled: (enabled: boolean) => void;
  settings: NotificationThresholdSettings;
};

const ThresholdPeriodByKey = {
  expenseAmountDay: "day",
  expenseAmountWeek: "week",
  expenseAmountMonth: "month",
} as const satisfies Record<NotificationThresholdKey, NotificationThresholdPeriod>;

export function NotificationThresholdField({
  onChangePeriod,
  onChangeValue,
  onToggleEnabled,
  settings,
}: NotificationThresholdFieldProps) {
  const currencyUnitLabel = CurrencyUnitLabels[resolveDisplayCurrency()];
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const selectedPeriodOption =
    settings.periodOptions.find((option) => option.key === settings.selectedKey) ??
    settings.periodOptions[0];
  const formattedAmountValue = formatAmountInput(settings.amountValue);
  const amountInputWidth = resolveAmountInputWidth(formattedAmountValue);

  return (
    <View style={styles.field}>
      <View style={styles.amountField}>
        <View style={styles.amountControl}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsPeriodPickerOpen(true)}
            style={({ pressed }) => [
              styles.periodButton,
              pressed ? styles.periodButtonPressed : null,
            ]}
          >
            <Text style={styles.periodText}>{selectedPeriodOption?.label}</Text>
            <Feather color={AppColors.mutedStrongText} name="chevron-down" size={16} />
          </Pressable>
          <View style={styles.amountRow}>
            <TextInput
              inputMode="numeric"
              keyboardType="numeric"
              maxLength={NotificationThresholdAmountInput.maxFormattedLength}
              onChangeText={onChangeValue}
              placeholder={NotificationThresholdAmountCopy.placeholder}
              returnKeyType="done"
              style={[styles.amountInput, { width: amountInputWidth }]}
              value={formattedAmountValue}
            />
            <Text {...AppTextBreakProps} style={styles.currency}>
              {currencyUnitLabel}
            </Text>
            <Text {...AppTextBreakProps} style={styles.amountSuffix}>
              {NotificationThresholdAmountCopy.exceededLabel}
            </Text>
          </View>
        </View>
        <Switch
          onValueChange={onToggleEnabled}
          thumbColor={settings.enabled ? AppColors.inverseText : AppColors.surface}
          trackColor={{ false: AppColors.border, true: AppColors.primary }}
          value={settings.enabled}
        />
      </View>
      <ThresholdPeriodPickerModal
        isOpen={isPeriodPickerOpen}
        onClose={() => setIsPeriodPickerOpen(false)}
        onSelect={(period) => {
          onChangePeriod(period);
          setIsPeriodPickerOpen(false);
        }}
        options={settings.periodOptions}
        selectedKey={settings.selectedKey}
      />
    </View>
  );
}

function resolveAmountInputWidth(value: string): number {
  const displayLength = Math.max(value.length, NotificationThresholdAmountCopy.placeholder.length);
  const measuredWidth =
    displayLength * NotificationThresholdAmountInput.characterWidth +
    NotificationThresholdAmountInput.horizontalPadding * 2;

  return Math.min(
    NotificationThresholdAmountInput.inputWidth,
    Math.max(NotificationThresholdAmountInput.minInputWidth, measuredWidth),
  );
}

function ThresholdPeriodPickerModal({
  isOpen,
  onClose,
  onSelect,
  options,
  selectedKey,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (period: NotificationThresholdPeriod) => void;
  options: NotificationThresholdSettings["periodOptions"];
  selectedKey: NotificationThresholdKey;
}) {
  const [draftKey, setDraftKey] = useState(selectedKey);

  useEffect(() => {
    if (isOpen) {
      setDraftKey(selectedKey);
    }
  }, [isOpen, selectedKey]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{NotificationUiCopy.thresholdPeriodPickerTitle}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </Pressable>
          </View>
          <Picker
            itemStyle={styles.pickerItem}
            selectedValue={draftKey}
            onValueChange={(value) => setDraftKey(value as NotificationThresholdKey)}
          >
            {options.map((option) => (
              <Picker.Item key={option.key} label={option.label} value={option.key} />
            ))}
          </Picker>
          <View style={styles.actionRow}>
            <ActionButton
              label="확인"
              onPress={() => {
                onSelect(ThresholdPeriodByKey[draftKey]);
              }}
              size="inline"
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  amountInput: {
    backgroundColor: "transparent",
    borderBottomColor: AppColors.border,
    borderBottomWidth: 1,
    borderCurve: "continuous",
    borderRadius: 0,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "600",
    height: 36,
    paddingHorizontal: NotificationThresholdAmountInput.horizontalPadding,
    paddingVertical: 0,
  },
  amountControl: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: 12,
    minWidth: 0,
  },
  amountRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  amountSuffix: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: ModalActionRowStyle,
  currency: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
    paddingEnd: 4,
  },
  field: {
    gap: 10,
    paddingVertical: 10,
  },
  amountField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCloseText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  modalOverlay: {
    backgroundColor: AppColors.overlay,
    flex: 1,
    justifyContent: "center",
  },
  modalSheet: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    gap: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  modalTitle: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  pickerItem: {
    color: AppColors.text,
    fontSize: 18,
  },
  periodButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 2,
    minHeight: 36,
    paddingHorizontal: 0,
  },
  periodText: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  periodButtonPressed: {
    opacity: 0.72,
  },
});
