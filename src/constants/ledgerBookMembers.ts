export const LedgerBookMembersUi = {
  maxVisibleMembers: 5,
  rowHeight: 44,
  rowTextLineHeight: 18,
  badgeLineHeight: 14,
  memberIdentityGap: 6,
  roleBadgeHorizontalPadding: 7,
  roleBadgeVerticalPadding: 3,
  selfBadgeHorizontalPadding: 6,
  selfBadgeVerticalPadding: 2,
  actionButtonHorizontalPadding: 8,
  actionButtonVerticalPadding: 5,
  actionHitSlop: 6,
  rowHorizontalPadding: 10,
  rowVerticalPadding: 8,
  listBorderRadius: 14,
  labelFontSize: 11,
  labelLineHeight: 16,
  labelBottomMargin: 2,
} as const;

export const LedgerBookMembersLayout = {
  listMaxHeight: LedgerBookMembersUi.maxVisibleMembers * LedgerBookMembersUi.rowHeight,
} as const;
