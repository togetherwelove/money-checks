import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EntryComposerCopy, EntryComposerUi } from "../../constants/entryComposer";
import { ICON_ACTION_BUTTON_COMPACT_SIZE } from "../IconActionButton";

export function EntryCancelButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      pointerEvents="box-only"
      collapsable={false}
      accessibilityRole="button"
      accessibilityLabel={EntryComposerCopy.clear}
      disabled={disabled}
      onPress={onPress}
      style={styles.touchArea}
    >
      <View pointerEvents="none" style={styles.iconFrame}>
        <Feather name="x" size={EntryComposerUi.cancelIconSize} color={AppColors.mutedText} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: ICON_ACTION_BUTTON_COMPACT_SIZE,
  },
  iconFrame: {
    width: ICON_ACTION_BUTTON_COMPACT_SIZE,
    height: ICON_ACTION_BUTTON_COMPACT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
