import { AppFontSize } from "../../constants/typography";
import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppSettingsCopy, AppSettingsUi } from "../../constants/appSettings";
import { AppLayout } from "../../constants/layout";
import {
  CalendarSummaryBaseDay,
  CalendarSummaryBaseDayOptions,
} from "../../constants/calendarSummary";
import { getAppColors } from "../../constants/colors";
import { ComposerBlockingModal } from "../ComposerBlockingModal";
import { EntryComposerHeader } from "../entryComposer/EntryComposerHeader";

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
    <ComposerBlockingModal
      visible={isOpen}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <EntryComposerHeader
            title={AppSettingsCopy.summaryBaseDayPickerTitle}
            onClose={onClose}
            actionLabel={AppSettingsCopy.summaryModePickerConfirmLabel}
            onAction={() => onSelect(draftDay)}
          />
          <Picker
            style={styles.wheel}
            itemStyle={styles.pickerItem}
            selectedValue={draftDay}
            onValueChange={(value) => setDraftDay(value as number)}
          >
            {CalendarSummaryBaseDayOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>
    </ComposerBlockingModal>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: AppLayout.cardContentPadding,
      backgroundColor: getAppColors().overlay,
    },
    dialog: {
      width: "100%",
      maxWidth: AppSettingsUi.summaryBaseDayDialogMaxWidth,
      borderRadius: AppLayout.cardRadius,
      backgroundColor: getAppColors().surface,
    },
    wheel: { height: AppSettingsUi.summaryBaseDayWheelHeight },
    pickerItem: { color: getAppColors().text, fontSize: AppFontSize.title },
  }),
);
