export const LedgerBookMembersUi = {
  maxVisibleMembers: 5,
  rowHeight: 34,
  rowTextLineHeight: 18,
  badgeLineHeight: 14,
  memberIdentityGap: 6,
  roleBadgeHorizontalPadding: 7,
  roleBadgeVerticalPadding: 2,
  selfBadgeHorizontalPadding: 6,
  selfBadgeVerticalPadding: 1,
  actionButtonBorderRadius: 8,
  actionButtonSize: 28,
  actionIconSize: 15,
  actionHitSlop: 6,
  disabledActionButtonOpacity: 0.45,
  rowHorizontalPadding: 10,
  rowVerticalPadding: 5,
  listBorderRadius: 14,
  labelFontSize: 11,
  labelLineHeight: 16,
  labelBottomMargin: 2,
} as const;

export const LedgerBookMembersLayout = {
  listMaxHeight: LedgerBookMembersUi.maxVisibleMembers * LedgerBookMembersUi.rowHeight,
} as const;
