import { Pressable, Text, View } from "react-native";
import { AppSettingsUi } from "../../constants/appSettings";
import { AppSettingsRowStyles as Row } from "../../constants/appSettingsStyles";
import { AppColors } from "../../constants/colors";
import { CompactTextProps } from "../../constants/textLayout";
import { Feather } from "../AppIcons";

export function SettingsActionRow({ label, description, disabled = false, embeddedInNativeRow = false, isLast = false, trailingIcon = "chevron-right", onPress }: {
  label: string;
  description?: string;
  disabled?: boolean;
  embeddedInNativeRow?: boolean;
  isLast?: boolean;
  trailingIcon?: "chevron-right" | "download";
  onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [Row.row, isLast && Row.lastRow,
      embeddedInNativeRow && Row.embeddedAction, disabled && Row.disabled, pressed && Row.pressed]}>
    <View style={Row.textBlock}>
      <Text {...CompactTextProps} style={Row.title}>{label}</Text>
      {description ? <Text {...CompactTextProps} style={Row.description}>{description}</Text> : null}
    </View>
    <Feather name={trailingIcon} size={AppSettingsUi.selectionChevronIconSize} color={AppColors.mutedStrongText} />
  </Pressable>;
}
