export type LedgerBookMemberRole = "editor" | "owner";

export type LedgerBookMember = {
  displayName: string;
  role: LedgerBookMemberRole;
  userId: string;
};
