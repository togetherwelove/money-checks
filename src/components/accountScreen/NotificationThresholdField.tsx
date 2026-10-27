import { MenuView,type MenuAction } from "@react-native-menu/menu";
import { useMemo } from "react";
import { Keyboard,Pressable,StyleSheet,Switch,Text,TextInput,View } from "react-native";
import { AppSettingsUi } from "../../constants/appSettings";
import { AppSettingsRowStyles } from "../../constants/appSettingsStyles";
import { AppColors } from "../../constants/colors";
import { CurrencyUnitLabels } from "../../constants/currency";
import { AppTextBreakProps } from "../../constants/textLayout";
import { Feather } from "../AppIcons";

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
  embeddedInNativeRow?: boolean;
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
  embeddedInNativeRow = false,
}: NotificationThresholdFieldProps) {
  const currencyUnitLabel = CurrencyUnitLabels[resolveDisplayCurrency()];
  const periodActions = useMemo<MenuAction[]>(
    () => settings.periodOptions.map((option) => ({
      id: option.key,
      title: option.label,
      state: option.key === settings.selectedKey ? "on" : "off",
    })),
    [settings.periodOptions, settings.selectedKey],
  );
  const selectedPeriodOption =
    settings.periodOptions.find((option) => option.key === settings.selectedKey) ??
    settings.periodOptions[0];
  const formattedAmountValue = formatAmountInput(settings.amountValue);
  const amountInputWidth = resolveAmountInputWidth(formattedAmountValue);

  return (
    <View style={[styles.field, embeddedInNativeRow && styles.embeddedField]}>
      <View style={styles.amountField}>
        <View style={styles.amountControl}>
          <MenuView
            actions={periodActions}
            title={NotificationUiCopy.thresholdPeriodPickerTitle}
            onOpenMenu={() => Keyboard.dismiss()}
            onPressAction={({ nativeEvent }) => {
              const option = settings.periodOptions.find((item) => item.key === nativeEvent.event);
              if (option) onChangePeriod(ThresholdPeriodByKey[option.key]);
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={NotificationUiCopy.thresholdPeriodPickerTitle}
              accessibilityValue={{ text: selectedPeriodOption?.label }}
              style={({ pressed }) => [
                styles.periodButton,
                pressed ? styles.periodButtonPressed : null,
              ]}
            >
              <Text style={styles.periodText}>{selectedPeriodOption?.label}</Text>
              <Feather color={AppColors.mutedStrongText} name="chevron-down" size={AppSettingsUi.selectionChevronIconSize} />
            </Pressable>
          </MenuView>
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

const styles = StyleSheet.create({
  embeddedField: { minHeight: 0, paddingVertical: 0 },
  amountInput: {
    backgroundColor: "transparent",
    borderBottomColor: AppColors.border,
    borderBottomWidth: 1,
    borderCurve: "continuous",
    borderRadius: 0,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "600",
    minHeight: 36,
    paddingHorizontal: NotificationThresholdAmountInput.horizontalPadding,
    paddingVertical: 4,
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
  currency: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
    paddingEnd: 4,
  },
  field: {
    gap: 10,
    minHeight: AppSettingsUi.rowMinHeight,
    paddingVertical: 10,
  },
  amountField: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  periodButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 2,
    minHeight: 36,
    paddingHorizontal: 0,
  },
  periodText: AppSettingsRowStyles.title,
  periodButtonPressed: {
    opacity: 0.72,
  },
});
