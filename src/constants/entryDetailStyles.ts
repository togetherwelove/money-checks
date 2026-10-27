import { MenuStyles } from "./menuStyles";
import { AppColors } from "./colors";
import type { TextStyle, ViewStyle } from "react-native";

import { EntryComposerUi } from "./entryComposer";
import { AppLayout } from "./layout";

export const EntryDetailLabelStyle: TextStyle = MenuStyles.title;
export const EntryDetailValueStyle: TextStyle = {
  ...MenuStyles.title,
  fontWeight: "600",
  color: AppColors.primary,
};
export const EntryDetailHintStyle: TextStyle = {
  ...MenuStyles.description,
  fontWeight: "400",
};
export const EntryDetailRowStyle: ViewStyle = {
  minHeight: EntryComposerUi.fieldHeight,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: AppLayout.screenPadding,
};
export const EntryDetailFieldStyle: ViewStyle = { gap: AppLayout.compactGap };

export const EntryDetailContainerStyle: ViewStyle = {
  paddingVertical: EntryComposerUi.detailsRowVerticalPadding,
  borderBottomWidth: MenuStyles.row.borderBottomWidth,
  borderBottomColor: AppColors.border,
};
