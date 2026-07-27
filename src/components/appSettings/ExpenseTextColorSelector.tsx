import { Feather } from "@expo/vector-icons";
import { type MenuAction, MenuView, type NativeActionEvent } from "@react-native-menu/menu";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  type ExpenseTextColorMode,
  ExpenseTextColorOptions,
} from "../../constants/expenseTextColor";
import { AppSettingsUi } from "../../constants/appSettings";
import { AppColors } from "../../constants/colors";
import { SettingValueActionStyle, SettingValueTextStyle } from "../../constants/uiStyles";

type ExpenseTextColorSelectorProps = {
  mode: ExpenseTextColorMode;
  onChange: (mode: ExpenseTextColorMode) => void;
};

export function ExpenseTextColorSelector({
  mode,
  onChange,
}: ExpenseTextColorSelectorProps) {
  const selectedOption =
    ExpenseTextColorOptions.find((option) => option.value === mode) ?? ExpenseTextColorOptions[0];
  const menuActions = useMemo<MenuAction[]>(
    () =>
      ExpenseTextColorOptions.map((option) => ({
        id: option.value,
        state: option.value === mode ? "on" : "off",
        title: option.label,
      })),
    [mode],
  );
  const handlePressAction = (event: NativeActionEvent) => {
    const selectedMenuOption = ExpenseTextColorOptions.find(
      (option) => option.value === event.nativeEvent.event,
    );
    if (selectedMenuOption) {
      onChange(selectedMenuOption.value);
    }
  };

  return (
    <MenuView actions={menuActions} onPressAction={handlePressAction} style={styles.container}>
      <View accessibilityRole="button" style={SettingValueActionStyle}>
        <Text style={SettingValueTextStyle}>{selectedOption.label}</Text>
        <Feather
          color={AppColors.mutedStrongText}
          name="chevron-down"
          size={AppSettingsUi.selectionChevronIconSize}
        />
      </View>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
  },
});
