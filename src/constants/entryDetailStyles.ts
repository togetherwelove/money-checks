import type { TextStyle, ViewStyle } from "react-native";

import { EntryComposerUi } from "./entryComposer";
import { AppLayout } from "./layout";
import { FormLabelTextStyle, SettingValueTextStyle } from "./uiStyles";

export const EntryDetailLabelStyle: TextStyle = FormLabelTextStyle;
export const EntryDetailValueStyle: TextStyle = {
  ...SettingValueTextStyle,
  fontWeight: "600",
};
export const EntryDetailHintStyle: TextStyle = {
  ...EntryDetailLabelStyle,
  fontWeight: "400",
};
export const EntryDetailRowStyle: ViewStyle = {
  minHeight: EntryComposerUi.detailsRowHeight,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: AppLayout.screenPadding,
};
export const EntryDetailFieldStyle: ViewStyle = { gap: AppLayout.compactGap };
