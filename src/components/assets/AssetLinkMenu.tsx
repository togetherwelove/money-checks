import { useAppTheme } from "../../hooks/useAppTheme";
import { MenuView } from "@react-native-menu/menu";
import { Keyboard, Pressable, Text, View } from "react-native";
import { getAssetStyles } from "../../constants/assetStyles";
import { AssetLinkCopy as Copy } from "../../constants/assetLink";
import { AppSettingsUi } from "../../constants/appSettings";
import { getAppColors } from "../../constants/colors";
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
  useAppTheme();
  const selected = options.find((option) => option.id === value);
  return (
    <View style={getAssetStyles().section}>
      <Text style={getAssetStyles().label}>{label}</Text>
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
          style={getAssetStyles().row}
        >
          <Text style={[getAssetStyles().text, getAssetStyles().grow]}>
            {selected?.name ?? (value ? Copy.unavailable : Copy.none)}
          </Text>
          <Feather
            name="chevron-down"
            size={AppSettingsUi.selectionChevronIconSize}
            color={getAppColors().primary}
          />
        </Pressable>
      </MenuView>
    </View>
  );
}
