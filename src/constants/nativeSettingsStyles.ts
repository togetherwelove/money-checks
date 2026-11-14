import { createThemeValue } from "../lib/appTheme";
import {
  background,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listSectionSpacing,
  listStyle,
  scrollContentBackground,
} from "@expo/ui/swift-ui/modifiers";
import { getAppColors } from "./colors";
import { MenuDesign } from "./menuDesign";

export const getNativeSettingsStyles = createThemeValue(() => ({
  footer: [listRowSeparator("hidden"), listRowBackground(getAppColors().screenBackground)],
  list: [
    listStyle("plain"),
    scrollContentBackground("hidden"),
    background(getAppColors().screenBackground),
    listSectionSpacing("compact"),
  ],
  title: [
    font({ size: MenuDesign.titleFontSize, weight: "bold" }),
    foregroundStyle(getAppColors().text),
    frame({ minHeight: MenuDesign.titleLineHeight, alignment: "leading" }),
  ],
  description: [
    font({ size: MenuDesign.descriptionFontSize }),
    foregroundStyle(getAppColors().mutedText),
    fixedSize({ horizontal: false, vertical: true }),
    frame({ minHeight: MenuDesign.descriptionLineHeight, alignment: "leading" }),
  ],
  row: [
    listRowBackground(getAppColors().screenBackground),
    listRowInsets({
      top: MenuDesign.verticalPadding,
      bottom: MenuDesign.verticalPadding,
      leading: MenuDesign.horizontalPadding,
      trailing: MenuDesign.horizontalPadding,
    }),
    frame({ minHeight: MenuDesign.rowMinHeight - MenuDesign.verticalPadding * 2 }),
  ],
  sectionTitle: [
    font({ size: MenuDesign.sectionFontSize, weight: "bold" }),
    foregroundStyle(getAppColors().mutedText),
  ],
}));
