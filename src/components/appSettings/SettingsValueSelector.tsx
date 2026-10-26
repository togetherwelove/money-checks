import { Feather } from "../AppIcons";
import { type MenuAction, MenuView, type NativeActionEvent } from "@react-native-menu/menu";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppSettingsUi } from "../../constants/appSettings";
import { AppColors } from "../../constants/colors";
import { SettingValueActionStyle, SettingValueTextStyle } from "../../constants/uiStyles";

type SettingsValueSelectorProps<Value extends string> = {
  value: Value;
  options: readonly { label: string; value: Value }[];
  onChange: (value: Value) => void;
};

export function SettingsValueSelector<Value extends string>({
  value,
  options,
  onChange,
}: SettingsValueSelectorProps<Value>) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];
  const menuActions = useMemo<MenuAction[]>(
    () =>
      options.map((option) => ({
        id: option.value,
        state: option.value === value ? "on" : "off",
        title: option.label,
      })),
    [options, value],
  );
  const handlePressAction = (event: NativeActionEvent) => {
    const selectedMenuOption = options.find(
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
