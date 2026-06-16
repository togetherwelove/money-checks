
export const MenuCopy = {
    sections: {
      account: "계정 및 알림",
      ledger: "내보내기",
      support: "이용 및 지원",
    },
  } as const;

export const MenuUi = {
  drawerAnimationDurationMs: 220,
  drawerWidth: 220,
  drawerGap: 20,
  drawerSwipeActiveOffsetX: 36,
  drawerSwipeCloseVelocityX: -520,
  drawerSwipeEdgeWidth: 16,
  drawerSwipeFailOffsetY: 24,
  drawerSwipeOpenThresholdRatio: 0.42,
  drawerSwipeOpenVelocityX: 520,
  itemGap: 2,
  itemIconGap: 12,
  itemPaddingVertical: 11,
  sectionGap: 8,
  sectionTitleFontSize: 12,
  titlePaddingTop: 20,
} as const;

export const FooterTabBarUi = {
  iconButtonSize: 24,
  primaryIconButtonSize: 36,
  barPaddingHorizontal: 8,
  borderTopWidth: 1,
  badgeDotBorderWidth: 2,
  badgeDotOffset: -1,
  badgeDotSize: 10,
  iconSize: 21,
  labelFontSize: 10,
  labelGap: 1,
  labelLineHeight: 12,
  tabGap: 3,
  tabPaddingVertical: 4,
} as const;

export const FooterTabBarMetrics = {
  height:
    Math.max(
      FooterTabBarUi.primaryIconButtonSize,
      FooterTabBarUi.iconButtonSize + FooterTabBarUi.labelGap + FooterTabBarUi.labelLineHeight,
    ) +
    FooterTabBarUi.tabPaddingVertical * 2 +
    FooterTabBarUi.borderTopWidth,
} as const;

export const FooterActionPopoverUi = {
  actionMinHeight: 46,
  actionPaddingHorizontal: 16,
  actionPaddingVertical: 12,
  borderRadius: 8,
  bottomOffset: 8,
  maxWidth: 320,
  textFontSize: 14,
} as const;
