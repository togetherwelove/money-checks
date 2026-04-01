export type LedgerBookMemberRole = "editor" | "owner" | "viewer";

export type LedgerBookMember = {
  displayName: string;
  role: LedgerBookMemberRole;
  userId: string;
};
