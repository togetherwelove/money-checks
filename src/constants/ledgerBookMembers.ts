export const LedgerBookMembersUi = {
  maxVisibleMembers: 3,
  rowHeight: 28,
} as const;

export const LedgerBookMembersLayout = {
  listMaxHeight: LedgerBookMembersUi.maxVisibleMembers * LedgerBookMembersUi.rowHeight,
} as const;
