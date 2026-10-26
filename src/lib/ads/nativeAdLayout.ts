import { NativeAdCardUi as ui } from "../../constants/ads";

export function resolveNativeAdLayout(width: number, fontScale: number) {
  const stacked = width < ui.stackedWidthThreshold || fontScale >= ui.stackedFontScaleThreshold;
  const copyHeight = (ui.headlineLineHeight * (stacked ? ui.stackedHeadlineReservedLines : 1)
    + ui.bodyLineHeight * (stacked ? ui.stackedBodyReservedLines : ui.bodyMaxLines)) * fontScale
    + ui.textBlockGap;
  const buttonHeight = Math.max(ui.callToActionIconButtonSize,
    ui.callToActionLineHeight * fontScale + ui.callToActionPaddingVertical * 2);
  const reservedHeight = Math.max(ui.minHeight, ui.contentPaddingVertical * 2
    + (stacked
      ? ui.iconSize + copyHeight + ui.sponsoredLabelFontSize * fontScale
        + buttonHeight + ui.contentGap * 2 + ui.textBlockGap
      : Math.max(ui.iconSize, copyHeight, buttonHeight)));
  return { stacked, reservedHeight };
}
