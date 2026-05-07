import type { TextProps } from "react-native";

export const AppTextBreakProps = {
  android_hyphenationFrequency: "none",
  lineBreakStrategyIOS: "standard",
  textBreakStrategy: "highQuality",
} as const satisfies Pick<
  TextProps,
  "android_hyphenationFrequency" | "lineBreakStrategyIOS" | "textBreakStrategy"
>;

export const OneLineTextFitProps = {
  ...AppTextBreakProps,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.75,
  numberOfLines: 1,
} as const satisfies Pick<
  TextProps,
  | "adjustsFontSizeToFit"
  | "android_hyphenationFrequency"
  | "lineBreakStrategyIOS"
  | "minimumFontScale"
  | "numberOfLines"
  | "textBreakStrategy"
>;
