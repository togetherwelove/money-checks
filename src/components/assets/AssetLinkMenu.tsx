import { MenuView } from "@react-native-menu/menu";
import { Keyboard, Pressable, Text, View } from "react-native";
import { AssetStyles as styles } from "../../constants/assetStyles";
import { AssetLinkCopy as Copy } from "../../constants/assetLink";
import { AppSettingsUi } from "../../constants/appSettings";
import { AppColors } from "../../constants/colors";
import { Feather } from "../AppIcons";

export function AssetLinkMenu({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value?: string | null;
  options: { id: string; name: string }[];
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const selected = options.find((option) => option.id === value);
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <MenuView
        actions={[
          { id: "none", title: Copy.none, state: !value ? "on" : "off" },
          ...options.map((option) => ({
            id: option.id,
            title: option.name,
            state: (value === option.id ? "on" : "off") as "on" | "off",
          })),
        ]}
        onOpenMenu={() => Keyboard.dismiss()}
        onPressAction={({ nativeEvent }) => {
          if (!disabled) onChange(nativeEvent.event === "none" ? null : nativeEvent.event);
        }}
      >
        <Pressable
          disabled={disabled}
          pointerEvents={disabled ? "none" : "auto"}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: selected?.name ?? (value ? Copy.unavailable : Copy.none) }}
          style={styles.row}
        >
          <Text style={[styles.text, styles.grow]}>
            {selected?.name ?? (value ? Copy.unavailable : Copy.none)}
          </Text>
          <Feather
            name="chevron-down"
            size={AppSettingsUi.selectionChevronIconSize}
            color={AppColors.primary}
          />
        </Pressable>
      </MenuView>
    </View>
  );
}
