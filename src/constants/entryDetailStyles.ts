import { createThemeValue } from "../lib/appTheme";
import { getMenuStyles } from "./menuStyles";
import { getAppColors } from "./colors";
import type { TextStyle, ViewStyle } from "react-native";

import { EntryComposerUi } from "./entryComposer";
import { AppLayout } from "./layout";

export const getEntryDetailLabelStyle = createThemeValue((): TextStyle => getMenuStyles().title);
export const getEntryDetailValueStyle = createThemeValue(
  (): TextStyle => ({
    ...getMenuStyles().title,
    fontWeight: "600",
    color: getAppColors().primary,
  }),
);
export const getEntryDetailHintStyle = createThemeValue(
  (): TextStyle => ({
    ...getMenuStyles().description,
    fontWeight: "400",
  }),
);
export const EntryDetailRowStyle: ViewStyle = {
  minHeight: EntryComposerUi.fieldHeight,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: AppLayout.screenPadding,
};
export const EntryDetailFieldStyle: ViewStyle = { gap: AppLayout.compactGap };

export const getEntryDetailContainerStyle = createThemeValue(
  (): ViewStyle => ({
    paddingVertical: EntryComposerUi.detailsRowVerticalPadding,
    borderBottomWidth: getMenuStyles().row.borderBottomWidth,
    borderBottomColor: getAppColors().border,
  }),
);
