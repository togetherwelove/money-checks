export const LedgerBookMembersUi = {
  maxVisibleMembers: 3,
  listGap: 6,
  rowHeight: 28,
} as const;

export const LedgerBookMembersLayout = {
  listMaxHeight:
    LedgerBookMembersUi.maxVisibleMembers * LedgerBookMembersUi.rowHeight +
    LedgerBookMembersUi.listGap * (LedgerBookMembersUi.maxVisibleMembers - 1),
} as const;
