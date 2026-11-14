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
  description,
  disabled = false,
  hasBadge = false,
  embeddedInNativeRow = false,
  isLast = false,
  leadingIcon,
  trailingIcon = "chevron-right",
  onPress,
}: {
  label: string;
  description?: string;
  disabled?: boolean;
  hasBadge?: boolean;
  embeddedInNativeRow?: boolean;
  isLast?: boolean;
  leadingIcon?: CategoryIconName;
  trailingIcon?: "chevron-right" | "download";
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
        disabled && getAppSettingsRowStyles().disabled,
        pressed && getAppSettingsRowStyles().pressed,
      ]}
    >
      {leadingIcon ? (
        <Feather
          name={leadingIcon}
          size={AppSettingsUi.selectionChevronIconSize}
          color={getAppColors().text}
        />
      ) : (
        <View accessible={false} style={getAppSettingsRowStyles().leadingIconSpace} />
      )}
      <View style={getAppSettingsRowStyles().textBlock}>
        <Text {...CompactTextProps} style={getAppSettingsRowStyles().title}>
          {label}
        </Text>
        {description ? (
          <Text {...CompactTextProps} style={getAppSettingsRowStyles().description}>
            {description}
          </Text>
        ) : null}
      </View>
      {hasBadge ? (
        <View accessible={false} style={getAppSettingsRowStyles().notificationDot} />
      ) : null}
      <Feather
        name={trailingIcon}
        size={AppSettingsUi.selectionChevronIconSize}
        color={getAppColors().mutedStrongText}
      />
    </Pressable>
  );
}
