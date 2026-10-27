import {
  background,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  listSectionSpacing,
  listStyle,
  scrollContentBackground,
} from "@expo/ui/swift-ui/modifiers";
import { AppColors } from "./colors";
import { MenuDesign } from "./menuDesign";

export const NativeSettingsStyles = {
  list: [
    listStyle("plain"),
    scrollContentBackground("hidden"),
    background(AppColors.screenBackground),
    listSectionSpacing("compact"),
  ],
  title: [
    font({ size: MenuDesign.titleFontSize, weight: "bold" }),
    foregroundStyle(AppColors.text),
    frame({ minHeight: MenuDesign.titleLineHeight, alignment: "leading" }),
  ],
  description: [
    font({ size: MenuDesign.descriptionFontSize }),
    foregroundStyle(AppColors.mutedText),
    fixedSize({ horizontal: false, vertical: true }),
    frame({ minHeight: MenuDesign.descriptionLineHeight, alignment: "leading" }),
  ],
  row: [
    listRowBackground(AppColors.screenBackground),
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
    foregroundStyle(AppColors.mutedText),
  ],
};
