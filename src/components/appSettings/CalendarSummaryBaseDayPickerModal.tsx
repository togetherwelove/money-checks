import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { AppSettingsCopy } from "../../constants/appSettings";
import {
  CalendarSummaryBaseDay,
  CalendarSummaryBaseDayOptions,
} from "../../constants/calendarSummary";
import { getAppColors } from "../../constants/colors";
import { NativePickerSheet } from "../NativePickerSheet";

export function CalendarSummaryBaseDayPickerModal({
  baseDay,
  isOpen,
  onClose,
  onSelect,
}: {
  baseDay: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (day: number) => void;
}) {
  const styles = getStyles();
  useAppTheme();
  const [draftDay, setDraftDay] = useState(baseDay ?? CalendarSummaryBaseDay.min);

  useEffect(() => {
    if (isOpen) {
      setDraftDay(baseDay ?? CalendarSummaryBaseDay.min);
    }
  }, [baseDay, isOpen]);

  return (
    <NativePickerSheet
      isOpen={isOpen}
      onClose={onClose}
      title={AppSettingsCopy.summaryBaseDayPickerTitle}
      action={{
        label: AppSettingsCopy.summaryModePickerConfirmLabel,
        onPress: () => onSelect(draftDay),
      }}
    >
      <Picker
        itemStyle={styles.pickerItem}
        selectedValue={draftDay}
        onValueChange={(value) => setDraftDay(value as number)}
      >
        {CalendarSummaryBaseDayOptions.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>
    </NativePickerSheet>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    pickerItem: { color: getAppColors().text, fontSize: 18 },
  }),
);
