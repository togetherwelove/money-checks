import { createThemeValue } from "../lib/appTheme";
import type { TextStyle, ViewStyle } from "react-native";

import { AuthControls } from "./authControls";
import { getAppColors } from "./colors";
import { AppLayout } from "./layout";

const CARD_PADDING = 16;
const FORM_INPUT_BORDER_WIDTH = 1;
const FORM_INPUT_FONT_SIZE = 16;
const FORM_INPUT_LINE_HEIGHT = 20;
const FORM_INPUT_HEIGHT = FORM_INPUT_LINE_HEIGHT + AuthControls.verticalPadding * 2 + 2;

const getFormInputBaseStyle = createThemeValue(
  (): TextStyle => ({
    paddingHorizontal: AuthControls.horizontalPadding,
    paddingVertical: AuthControls.verticalPadding,
    borderWidth: FORM_INPUT_BORDER_WIDTH,
    borderColor: getAppColors().border,
    borderRadius: AuthControls.borderRadius,
    backgroundColor: getAppColors().background,
    color: getAppColors().text,
    fontSize: FORM_INPUT_FONT_SIZE,
    lineHeight: FORM_INPUT_LINE_HEIGHT,
  }),
);

export const getPageSectionStyle = createThemeValue(
  (): ViewStyle => ({
    backgroundColor: getAppColors().screenBackground,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: CARD_PADDING,
  }),
);

export const getListGroupStyle = createThemeValue(
  (): ViewStyle => ({
    borderWidth: AppLayout.dividerWidth,
    borderColor: getAppColors().border,
    borderRadius: AppLayout.groupRadius,
    backgroundColor: getAppColors().screenBackground,
    overflow: "hidden",
  }),
);

export const getListGroupRowStyle = createThemeValue(
  (): ViewStyle => ({
    borderBottomColor: getAppColors().border,
    borderBottomWidth: AppLayout.dividerWidth,
    backgroundColor: getAppColors().screenBackground,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: CARD_PADDING,
  }),
);

export const getActionSurfaceStyle = createThemeValue(
  (): ViewStyle => ({
    borderWidth: AppLayout.dividerWidth,
    borderColor: getAppColors().border,
    borderRadius: AppLayout.groupRadius,
    backgroundColor: getAppColors().surfaceMuted,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: CARD_PADDING,
  }),
);

export const getGroupedSectionStyle = createThemeValue(
  (): ViewStyle => ({
    ...getListGroupStyle(),
    ...getPageSectionStyle(),
  }),
);

export const getInsetBoxStyle = createThemeValue(
  (): ViewStyle => ({
    borderRadius: AppLayout.groupRadius,
    backgroundColor: getAppColors().surfaceStrong,
    paddingHorizontal: AuthControls.horizontalPadding,
    paddingVertical: AuthControls.verticalPadding,
  }),
);

export const getInsetPanelStyle = createThemeValue(
  (): ViewStyle => ({
    ...getListGroupStyle(),
  }),
);

export const getCardTitleTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().text,
    fontSize: 15,
    fontWeight: "800",
  }),
);

export const getScreenTitleTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().text,
    fontSize: 22,
    fontWeight: "800",
  }),
);

export const SettingValueActionStyle: ViewStyle = {
  alignItems: "center",
  flexDirection: "row",
  flexShrink: 0,
  gap: AppLayout.compactGap,
};

export const getSettingValueTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().text,
    fontSize: 13,
    fontWeight: "800",
  }),
);

export const getFormLabelTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().mutedText,
    fontSize: 12,
    fontWeight: "700",
  }),
);

export const getCompactLabelTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().mutedText,
    fontSize: 11,
    fontWeight: "600",
  }),
);

export const getBrandPlusTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().accent,
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "lowercase",
  }),
);

export const getFormInputTextStyle = createThemeValue(
  (): TextStyle => ({
    ...getFormInputBaseStyle(),
    minHeight: FORM_INPUT_HEIGHT,
  }),
);

export const getFormMultilineInputTextStyle = createThemeValue(
  (): TextStyle => ({
    ...getFormInputBaseStyle(),
    minHeight: AuthControls.multilineControlMinHeight,
  }),
);

const getUnderlineFormInputBaseStyle = createThemeValue(
  (): TextStyle => ({
    borderWidth: 0,
    borderBottomWidth: FORM_INPUT_BORDER_WIDTH,
    borderBottomColor: getAppColors().border,
    borderRadius: 0,
    backgroundColor: getAppColors().transparent,
    paddingHorizontal: 0,
  }),
);

export const getUnderlineFormInputTextStyle = createThemeValue(
  (): TextStyle => ({
    ...getFormInputTextStyle(),
    ...getUnderlineFormInputBaseStyle(),
  }),
);

export const getUnderlineFormMultilineInputTextStyle = createThemeValue(
  (): TextStyle => ({
    ...getFormMultilineInputTextStyle(),
    ...getUnderlineFormInputBaseStyle(),
  }),
);

export const FullBleedHorizontalStyle: ViewStyle = {
  marginHorizontal: -AppLayout.screenPadding,
};

export const FullBleedPaddedHorizontalStyle: ViewStyle = {
  ...FullBleedHorizontalStyle,
  paddingHorizontal: AppLayout.screenPadding,
};

export const ResponsivePageContentStyle: ViewStyle = {
  alignSelf: "center",
  maxWidth: AppLayout.pageContentMaxWidth,
  width: "100%",
};

export const StatusMessageTextStyle: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
  lineHeight: 18,
};

export const getNoteTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().mutedStrongText,
    fontSize: 12,
    lineHeight: 18,
  }),
);

export const getSupportingTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().mutedText,
    fontSize: 12,
    lineHeight: 18,
  }),
);

export const ModalActionRowStyle: ViewStyle = {
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 8,
};

export const ActionButtonLabelTextStyle: TextStyle = {
  fontSize: 15,
  fontWeight: "700",
};
