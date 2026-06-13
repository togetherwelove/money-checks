import type { TextProps } from "react-native";

export const AppTextBreakProps = {
  lineBreakStrategyIOS: "standard",
} as const satisfies Pick<TextProps, "lineBreakStrategyIOS">;

export const OneLineTextFitProps = {
  ...AppTextBreakProps,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.75,
  numberOfLines: 1,
} as const satisfies Pick<
  TextProps,
  | "adjustsFontSizeToFit"
  | "lineBreakStrategyIOS"
  | "minimumFontScale"
  | "numberOfLines"
>;
