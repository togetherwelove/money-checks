import { Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { accessibilityLabel, accessibilityValue, buttonStyle } from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { EntryComposerUi } from "../../constants/entryComposer";
import { EntryDetailLabelStyle, EntryDetailRowStyle, EntryDetailValueStyle } from "../../constants/entryDetailStyles";
import { CompactTextProps } from "../../constants/textLayout";
import { SettingValueActionStyle } from "../../constants/uiStyles";
import { AppColors } from "../../constants/colors";
import { AppSettingsUi } from "../../constants/appSettings";
import { Feather } from "../AppIcons";

const menuModifiers = [buttonStyle("plain")];
const hostStyle = { height: EntryComposerUi.fieldHeight, minWidth: EntryComposerUi.fieldHeight, flexShrink: 1 };

export function NativeEntryDetailMenu({ label, value, children }: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return <View style={EntryDetailRowStyle}>
    <Text {...CompactTextProps} style={EntryDetailLabelStyle}>{label}</Text>
    <Host style={hostStyle} matchContents={{ horizontal: true }} alignment="trailing">
      <Menu modifiers={[...menuModifiers, accessibilityLabel(label), accessibilityValue(value)]} label={<RNHostView matchContents>
        <View pointerEvents="none" style={EntryDetailRowStyle}>
          <View style={SettingValueActionStyle}>
            <Text {...CompactTextProps} numberOfLines={1} style={EntryDetailValueStyle}>{value}</Text>
            <Feather name="chevron-down" size={AppSettingsUi.selectionChevronIconSize} color={AppColors.primary} />
          </View>
        </View>
      </RNHostView>}>
        {children}
      </Menu>
    </Host>
  </View>;
}
