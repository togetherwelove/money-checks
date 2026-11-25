import {
  background,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  fixedSize,
  lineLimit,
  multilineTextAlignment,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { createThemeValue } from "../lib/appTheme";
import { getAppColors } from "./colors";
import { SettingsGroupDesign } from "./settingsGroupStyles";

export const getNativeSettingsGroupStyles = createThemeValue(() => ({
  section: [frame({ maxWidth: Infinity, alignment: "leading" })],
  caption: [
    lineLimit(),
    multilineTextAlignment("leading"),
    font({ size: SettingsGroupDesign.descriptionFontSize }),
    foregroundStyle(getAppColors().mutedText),
    fixedSize({ horizontal: false, vertical: true }),
    frame({ maxWidth: Infinity, alignment: "leading" }),
    padding({ horizontal: SettingsGroupDesign.horizontalPadding }),
  ],
  outer: [
    frame({ maxWidth: Infinity, alignment: "leading" }),
    padding({ all: SettingsGroupDesign.borderWidth }),
    background(getAppColors().border),
    cornerRadius(SettingsGroupDesign.radius),
  ],
  inner: [
    frame({ maxWidth: Infinity, alignment: "leading" }),
    background(getAppColors().surface),
    cornerRadius(SettingsGroupDesign.radius - SettingsGroupDesign.borderWidth),
  ],
  divider: [padding({ leading: SettingsGroupDesign.horizontalPadding })],
  row: [
    padding({
      horizontal: SettingsGroupDesign.horizontalPadding,
      vertical: SettingsGroupDesign.rowVerticalPadding,
    }),
    frame({
      minHeight: SettingsGroupDesign.rowMinHeight,
      maxWidth: Infinity,
      alignment: "leading",
    }),
    foregroundStyle(getAppColors().text),
    font({ size: SettingsGroupDesign.labelFontSize }),
  ],
  title: [font({ size: SettingsGroupDesign.labelFontSize }), foregroundStyle(getAppColors().text)],
  value: [
    font({ size: SettingsGroupDesign.labelFontSize }),
    foregroundStyle(getAppColors().mutedText),
  ],
  description: [
    font({ size: SettingsGroupDesign.descriptionFontSize }),
    foregroundStyle(getAppColors().mutedText),
  ],
}));
