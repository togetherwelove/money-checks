import { selectStaticCopy } from "../i18n/staticCopy";

export const MenuCopy = selectStaticCopy({
  en: {
    sections: {
      account: "Account & Alerts",
      ledger: "Export",
      support: "Plans & Support",
    },
  },
  ko: {
    sections: {
      account: "계정 및 알림",
      ledger: "내보내기",
      support: "이용 및 지원",
    },
  },
} as const);

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
  activeIconButtonSize: 44,
  barPaddingHorizontal: 8,
  barPaddingTop: 4,
  barRadius: 0,
  badgeDotBorderWidth: 2,
  badgeDotOffset: 6,
  badgeDotSize: 10,
  centerButtonSize: 50,
  iconSize: 21,
  minHeight: 54,
  primaryButtonShadowOffsetY: 4,
  primaryButtonShadowOpacity: 0.24,
  primaryButtonShadowRadius: 10,
  tabGap: 3,
  tabPaddingVertical: 5,
} as const;

export const FooterActionPopoverUi = {
  actionMinHeight: 46,
  actionPaddingHorizontal: 16,
  actionPaddingVertical: 12,
  borderRadius: 8,
  bottomOffset: 8,
  maxWidth: 320,
  shadowOffsetY: 6,
  shadowOpacity: 0.16,
  shadowRadius: 14,
  textFontSize: 14,
} as const;
