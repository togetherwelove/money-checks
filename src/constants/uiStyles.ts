import type { TextStyle, ViewStyle } from "react-native";

import { AuthControls } from "./authControls";
import { AppColors } from "./colors";
import { AppLayout } from "./layout";

const CARD_PADDING = 16;
const FORM_INPUT_FONT_SIZE = 16;
const FORM_INPUT_LINE_HEIGHT = 20;
const FORM_INPUT_HEIGHT = FORM_INPUT_LINE_HEIGHT + AuthControls.verticalPadding * 2 + 2;

const FormInputBaseStyle: TextStyle = {
  paddingHorizontal: AuthControls.horizontalPadding,
  paddingVertical: AuthControls.verticalPadding,
  borderWidth: 1,
  borderColor: AppColors.border,
  borderRadius: AuthControls.borderRadius,
  backgroundColor: AppColors.background,
  color: AppColors.text,
  fontSize: FORM_INPUT_FONT_SIZE,
  lineHeight: FORM_INPUT_LINE_HEIGHT,
};

export const SurfaceCardStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: AppColors.border,
  borderRadius: AppLayout.cardRadius,
  backgroundColor: AppColors.surface,
  padding: CARD_PADDING,
};

export const InsetBoxStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: AppColors.border,
  borderRadius: AuthControls.borderRadius,
  backgroundColor: AppColors.background,
  paddingHorizontal: AuthControls.horizontalPadding,
  paddingVertical: AuthControls.verticalPadding,
};

export const InsetPanelStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: AppColors.border,
  borderRadius: AuthControls.borderRadius,
  backgroundColor: AppColors.background,
};

export const CardTitleTextStyle: TextStyle = {
  color: AppColors.text,
  fontSize: 15,
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
  height: FORM_INPUT_HEIGHT,
};

export const FormMultilineInputTextStyle: TextStyle = {
  ...FormInputBaseStyle,
  minHeight: AuthControls.multilineControlMinHeight,
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
