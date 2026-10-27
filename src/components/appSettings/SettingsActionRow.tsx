import { Pressable, Text, View } from "react-native";
import { AppSettingsUi } from "../../constants/appSettings";
import { AppSettingsRowStyles as Row } from "../../constants/appSettingsStyles";
import { AppColors } from "../../constants/colors";
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
        Row.row,
        isLast && Row.lastRow,
        embeddedInNativeRow && Row.embeddedAction,
        disabled && Row.disabled,
        pressed && Row.pressed,
      ]}
    >
      {leadingIcon ? (
        <Feather
          name={leadingIcon}
          size={AppSettingsUi.selectionChevronIconSize}
          color={AppColors.text}
        />
      ) : null}
      <View style={Row.textBlock}>
        <Text {...CompactTextProps} style={Row.title}>
          {label}
        </Text>
        {description ? (
          <Text {...CompactTextProps} style={Row.description}>
            {description}
          </Text>
        ) : null}
      </View>
      {hasBadge ? <View accessible={false} style={Row.notificationDot} /> : null}
      <Feather
        name={trailingIcon}
        size={AppSettingsUi.selectionChevronIconSize}
        color={AppColors.mutedStrongText}
      />
    </Pressable>
  );
}
