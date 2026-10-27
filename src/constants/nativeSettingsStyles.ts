import { font, foregroundStyle, frame, listRowBackground, listRowInsets } from "@expo/ui/swift-ui/modifiers";
import { AppColors } from "./colors";
import { MenuDesign } from "./menuDesign";

export const NativeSettingsStyles = {
  row: [
    listRowBackground(AppColors.screenBackground),
    listRowInsets({ top: MenuDesign.verticalPadding, bottom: MenuDesign.verticalPadding,
      leading: MenuDesign.horizontalPadding, trailing: MenuDesign.horizontalPadding }),
    frame({ minHeight: MenuDesign.rowMinHeight - MenuDesign.verticalPadding * 2 }),
  ],
  sectionTitle: [font({ size: MenuDesign.sectionFontSize, weight: "bold" }), foregroundStyle(AppColors.mutedText)],
};
