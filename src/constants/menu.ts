export const MenuCopy = {
  sections: {
    account: "내 계정",
    ledger: "가계부",
    settings: "설정",
    support: "이용 및 지원",
  },
} as const;

export const FooterTabBarUi = {
  activeTabBorderRadius: 24,
  badgeDotOffset: -1,
  badgeDotSize: 8,
  barBorderRadius: 30,
  barBorderWidth: 1,
  barBottomInset: 0,
  barElevation: 8,
  barHorizontalInset: 12,
  barMinHeight: 60,
  barPaddingHorizontal: 4,
  barShadowOffsetX: 0,
  barShadowOffsetY: 6,
  barShadowOpacity: 0.14,
  barShadowRadius: 18,
  barZIndex: 15,
  contentBottomGap: 12,
  disabledOpacity: 0.45,
  iconButtonSize: 30,
  iconSize: 24,
  labelFontSize: 11,
  labelGap: 2,
  labelLineHeight: 12,
  pressedTabOpacity: 0.7,
  tabGap: 2,
  tabPaddingHorizontal: 4,
  tabPaddingVertical: 8,
} as const;

export function resolveFooterTabBarHeight(fontScale = 1): number {
  const compactFontScale = resolveTextScale(fontScale, AppTextScale.compact);

  return (
    Math.max(
      FooterTabBarUi.barMinHeight,
      FooterTabBarUi.iconButtonSize +
        FooterTabBarUi.labelGap +
        FooterTabBarUi.labelLineHeight * compactFontScale +
        FooterTabBarUi.tabPaddingVertical * 2,
    ) +
    FooterTabBarUi.barBorderWidth * 2
  );
}

import { AppTextScale, resolveTextScale } from "./textLayout";
