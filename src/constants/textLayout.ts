import type { TextProps } from "react-native";

export const AppTextScale = {
  compact: 1.3,
  content: 1.5,
  reading: 2,
} as const;

export const AppTextBreakProps = {
  lineBreakStrategyIOS: "hangul-word",
} as const satisfies Pick<TextProps, "lineBreakStrategyIOS">;

export const CompactTextProps = {
  maxFontSizeMultiplier: AppTextScale.compact,
} as const satisfies Pick<TextProps, "maxFontSizeMultiplier">;

export const ContentTextProps = {
  maxFontSizeMultiplier: AppTextScale.content,
} as const satisfies Pick<TextProps, "maxFontSizeMultiplier">;

export const ReadingTextProps = {
  maxFontSizeMultiplier: AppTextScale.reading,
} as const satisfies Pick<TextProps, "maxFontSizeMultiplier">;

export const OneLineTextFitProps = {
  ...AppTextBreakProps,
  ...CompactTextProps,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.75,
  numberOfLines: 1,
} as const satisfies Pick<
  TextProps,
  | "adjustsFontSizeToFit"
  | "lineBreakStrategyIOS"
  | "maxFontSizeMultiplier"
  | "minimumFontScale"
  | "numberOfLines"
>;

export function resolveTextScale(fontScale: number, maxFontSizeMultiplier: number): number {
  if (!Number.isFinite(fontScale) || fontScale <= 0) {
    return 1;
  }

  return Math.min(fontScale, maxFontSizeMultiplier);
}
