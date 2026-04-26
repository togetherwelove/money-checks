import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import {
  CATEGORY_DELETE_DROP_ZONE_ICON_SIZE,
  CATEGORY_DELETE_DROP_ZONE_SIZE,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";

type CategoryDeleteDropZoneProps = {
  isActive: boolean;
  onLayout: () => void;
};

export function CategoryDeleteDropZone({ isActive, onLayout }: CategoryDeleteDropZoneProps) {
  return (
    <View
      onLayout={onLayout}
      pointerEvents="none"
      style={[styles.container, isActive && styles.activeContainer]}
    >
      <Feather
        color={isActive ? AppColors.inverseText : AppColors.expense}
        name="trash-2"
        size={CATEGORY_DELETE_DROP_ZONE_ICON_SIZE}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    width: CATEGORY_DELETE_DROP_ZONE_SIZE,
    height: CATEGORY_DELETE_DROP_ZONE_SIZE,
    borderRadius: CATEGORY_DELETE_DROP_ZONE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.expense,
    backgroundColor: AppColors.surface,
  },
  activeContainer: {
    backgroundColor: AppColors.expense,
  },
});
