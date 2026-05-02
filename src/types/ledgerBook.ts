export type LedgerBook = {
  id: string;
  name: string;
  ownerId: string;
  shareCode: string;
};

export type LedgerBookAccessRole = "editor" | "owner" | "viewer";

export type AccessibleLedgerBook = LedgerBook & {
  role: LedgerBookAccessRole;
};
