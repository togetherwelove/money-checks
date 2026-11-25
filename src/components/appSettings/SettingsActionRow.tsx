import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { AllMenuIcons } from "../../constants/allMenu";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Pressable, Text, View } from "react-native";
import { AppSettingsUi } from "../../constants/appSettings";
import { getAppSettingsRowStyles } from "../../constants/appSettingsStyles";
import { getAppColors } from "../../constants/colors";
import { NotificationBadgeCopy } from "../../constants/notificationBadges";
import { CompactTextProps } from "../../constants/textLayout";
import type { CategoryIconName } from "../../types/category";
import { Feather } from "../AppIcons";

export function SettingsActionRow({
  label,
  disabled = false,
  hasBadge = false,
  embeddedInNativeRow = false,
  grouped = false,
  isLast = false,
  leadingIcon,
  trailingIcon = "chevron-right",
  onPress,
}: {
  label: string;
  disabled?: boolean;
  hasBadge?: boolean;
  embeddedInNativeRow?: boolean;
  grouped?: boolean;
  isLast?: boolean;
  leadingIcon?: CategoryIconName | typeof AllMenuIcons.excelExport;
  trailingIcon?: "chevron-right" | "download" | null;
  onPress: () => void;
}) {
  useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        hasBadge ? `${label}, ${NotificationBadgeCopy.unreadBookAccessibilityLabel}` : undefined
      }
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        getAppSettingsRowStyles().row,
        isLast && getAppSettingsRowStyles().lastRow,
        embeddedInNativeRow && getAppSettingsRowStyles().embeddedAction,
        grouped && getSettingsGroupStyles().row,
        disabled && getAppSettingsRowStyles().disabled,
        pressed && getAppSettingsRowStyles().pressed,
      ]}
    >
      {leadingIcon === AllMenuIcons.excelExport ? (
        <MaterialCommunityIcons
          name={AllMenuIcons.excelExport}
          size={grouped ? SettingsGroupDesign.iconSize : AppSettingsUi.selectionChevronIconSize}
          color={getAppColors().text}
        />
      ) : leadingIcon ? (
        <Feather
          name={leadingIcon}
          size={grouped ? SettingsGroupDesign.iconSize : AppSettingsUi.selectionChevronIconSize}
          color={getAppColors().text}
        />
      ) : (
        <View
          accessible={false}
          style={
            grouped
              ? getSettingsGroupStyles().leadingIconSpace
              : getAppSettingsRowStyles().leadingIconSpace
          }
        />
      )}
      <View
        style={[getAppSettingsRowStyles().textBlock, grouped && getSettingsGroupStyles().textBlock]}
      >
        <Text
          {...CompactTextProps}
          style={[getAppSettingsRowStyles().title, grouped && getSettingsGroupStyles().label]}
        >
          {label}
        </Text>
      </View>
      {hasBadge ? (
        <View accessible={false} style={getAppSettingsRowStyles().notificationDot} />
      ) : null}
      {trailingIcon ? (
        <Feather
          name={trailingIcon}
          size={grouped ? SettingsGroupDesign.iconSize : AppSettingsUi.selectionChevronIconSize}
          color={getAppColors().mutedStrongText}
        />
      ) : null}
    </Pressable>
  );
}
