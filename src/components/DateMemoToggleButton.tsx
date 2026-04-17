import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";
import { DateMemoCopy, DateMemoUi } from "../constants/dateMemo";
import { ICON_ACTION_BUTTON_COMPACT_SIZE } from "./IconActionButton";

type DateMemoToggleButtonProps = {
  isExpanded: boolean;
  onPress: () => void;
};

export function DateMemoToggleButton({ isExpanded, onPress }: DateMemoToggleButtonProps) {
  return (
    <Pressable
      accessibilityLabel={DateMemoCopy.toggleAccessibilityLabel}
      onPress={onPress}
      style={styles.button}
    >
      <MaterialCommunityIcons
        color={isExpanded ? AppColors.primary : AppColors.mutedText}
        name={isExpanded ? DateMemoUi.activeIconName : DateMemoUi.inactiveIconName}
        size={DateMemoUi.toggleIconSize}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ICON_ACTION_BUTTON_COMPACT_SIZE,
    height: ICON_ACTION_BUTTON_COMPACT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: AuthControls.borderRadius,
  },
});
