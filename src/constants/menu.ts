
export const MenuCopy = {
    closeAccessibilityLabel: "메뉴 닫기",
    openAccessibilityLabel: "메뉴 열기",
    sections: {
      account: "계정",
      ledger: "내보내기",
      support: "이용 및 지원",
    },
  } as const;

export const MenuUi = {
  floatingButtonHitSlop: 8,
  floatingButtonIconSize: 18,
  floatingButtonInset: 8,
  floatingButtonVerticalInset: 2,
  floatingButtonPressedOpacity: 0.7,
  floatingButtonReservedWidth: 44,
  floatingButtonSize: 40,
  floatingButtonZIndex: 30,
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
  iconButtonSize: 30,
  iconSize: 24,
  labelFontSize: 11,
  labelGap: 2,
  labelLineHeight: 12,
  pressedTabOpacity: 0.7,
  primaryIconButtonSize: 44,
  tabGap: 2,
  tabPaddingHorizontal: 4,
  tabPaddingVertical: 8,
} as const;

export function resolveFooterTabBarHeight(fontScale = 1): number {
  const compactFontScale = resolveTextScale(fontScale, AppTextScale.compact);

  return Math.max(
    FooterTabBarUi.barMinHeight,
    FooterTabBarUi.primaryIconButtonSize + FooterTabBarUi.tabPaddingVertical * 2,
    FooterTabBarUi.iconButtonSize +
      FooterTabBarUi.labelGap +
      FooterTabBarUi.labelLineHeight * compactFontScale +
      FooterTabBarUi.tabPaddingVertical * 2,
  ) + FooterTabBarUi.barBorderWidth * 2;
}

export const FooterActionPopoverUi = {
  actionMinHeight: 46,
  actionPaddingHorizontal: 16,
  actionPaddingVertical: 12,
  borderRadius: 8,
  bottomOffset: 8,
  maxWidth: 320,
  textFontSize: 14,
} as const;
import { AppTextScale, resolveTextScale } from "./textLayout";
