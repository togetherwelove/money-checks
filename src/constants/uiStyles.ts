import type { TextStyle, ViewStyle } from "react-native";

import { AuthControls } from "./authControls";
import { AppColors } from "./colors";
import { AppLayout } from "./layout";

const CARD_PADDING = 16;
const FORM_INPUT_BORDER_WIDTH = 1;
const FORM_INPUT_FONT_SIZE = 16;
const FORM_INPUT_LINE_HEIGHT = 20;
const FORM_INPUT_HEIGHT = FORM_INPUT_LINE_HEIGHT + AuthControls.verticalPadding * 2 + 2;

const FormInputBaseStyle: TextStyle = {
  paddingHorizontal: AuthControls.horizontalPadding,
  paddingVertical: AuthControls.verticalPadding,
  borderWidth: FORM_INPUT_BORDER_WIDTH,
  borderColor: AppColors.border,
  borderRadius: AuthControls.borderRadius,
  backgroundColor: AppColors.background,
  color: AppColors.text,
  fontSize: FORM_INPUT_FONT_SIZE,
  lineHeight: FORM_INPUT_LINE_HEIGHT,
};

export const PageSectionStyle: ViewStyle = {
  backgroundColor: AppColors.screenBackground,
  paddingHorizontal: CARD_PADDING,
  paddingVertical: CARD_PADDING,
};

export const ListGroupStyle: ViewStyle = {
  borderWidth: AppLayout.dividerWidth,
  borderColor: AppColors.border,
  borderRadius: AppLayout.groupRadius,
  backgroundColor: AppColors.screenBackground,
  overflow: "hidden",
};

export const ListGroupRowStyle: ViewStyle = {
  borderBottomColor: AppColors.border,
  borderBottomWidth: AppLayout.dividerWidth,
  backgroundColor: AppColors.screenBackground,
  paddingHorizontal: CARD_PADDING,
  paddingVertical: CARD_PADDING,
};

export const ActionSurfaceStyle: ViewStyle = {
  borderWidth: AppLayout.dividerWidth,
  borderColor: AppColors.border,
  borderRadius: AppLayout.groupRadius,
  backgroundColor: AppColors.surfaceMuted,
  paddingHorizontal: CARD_PADDING,
  paddingVertical: CARD_PADDING,
};

export const GroupedSectionStyle: ViewStyle = {
  ...ListGroupStyle,
  ...PageSectionStyle,
};

export const InsetBoxStyle: ViewStyle = {
  borderRadius: AppLayout.groupRadius,
  backgroundColor: AppColors.surfaceStrong,
  paddingHorizontal: AuthControls.horizontalPadding,
  paddingVertical: AuthControls.verticalPadding,
};

export const InsetPanelStyle: ViewStyle = {
  ...ListGroupStyle,
};

export const CardTitleTextStyle: TextStyle = {
  color: AppColors.text,
  fontSize: 15,
  fontWeight: "800",
};

export const SettingValueActionStyle: ViewStyle = {
  alignItems: "center",
  flexDirection: "row",
  flexShrink: 0,
  gap: AppLayout.compactGap,
};

export const SettingValueTextStyle: TextStyle = {
  color: AppColors.text,
  fontSize: 13,
  fontWeight: "800",
};

export const FormLabelTextStyle: TextStyle = {
  color: AppColors.mutedText,
  fontSize: 12,
  fontWeight: "700",
};

export const CompactLabelTextStyle: TextStyle = {
  color: AppColors.mutedText,
  fontSize: 11,
  fontWeight: "600",
};

export const BrandPlusTextStyle: TextStyle = {
  color: AppColors.accent,
  fontSize: 14,
  fontStyle: "italic",
  fontWeight: "800",
  letterSpacing: 0.8,
  textTransform: "lowercase",
};

export const FormInputTextStyle: TextStyle = {
  ...FormInputBaseStyle,
  minHeight: FORM_INPUT_HEIGHT,
};

export const FormMultilineInputTextStyle: TextStyle = {
  ...FormInputBaseStyle,
  minHeight: AuthControls.multilineControlMinHeight,
};

const UnderlineFormInputBaseStyle: TextStyle = {
  borderWidth: 0,
  borderBottomWidth: FORM_INPUT_BORDER_WIDTH,
  borderBottomColor: AppColors.border,
  borderRadius: 0,
  backgroundColor: AppColors.transparent,
  paddingHorizontal: 0,
};

export const UnderlineFormInputTextStyle: TextStyle = {
  ...FormInputTextStyle,
  ...UnderlineFormInputBaseStyle,
};

export const UnderlineFormMultilineInputTextStyle: TextStyle = {
  ...FormMultilineInputTextStyle,
  ...UnderlineFormInputBaseStyle,
};

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

export const NoteTextStyle: TextStyle = {
  color: AppColors.mutedStrongText,
  fontSize: 12,
  lineHeight: 18,
};

export const SupportingTextStyle: TextStyle = {
  color: AppColors.mutedText,
  fontSize: 12,
  lineHeight: 18,
};

export const ModalActionRowStyle: ViewStyle = {
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 8,
};
