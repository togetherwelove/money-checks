export type LedgerEntryRow = {
  book_id: string;
  id: string;
  user_id: string;
  source_type: string;
  entry_type: "income" | "expense";
  occurred_on: string;
  amount: number;
  currency: string;
  category: string;
  note: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LedgerBookRow = {
  id: string;
  name: string;
  owner_id: string;
  share_code: string;
};

export type LedgerBookMemberRow = {
  book_id: string;
  role: "editor" | "owner" | "viewer";
  user_id: string;
};

export type LedgerBookMemberProfileRow = {
  display_name: string | null;
  role: "editor" | "owner" | "viewer";
  user_id: string;
};

export type LedgerBookJoinRequestRow = {
  book_id: string;
  created_at: string;
  id: string;
  requester_user_id: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: "approved" | "pending" | "rejected";
};

export type LedgerBookJoinRequestProfileRow = {
  created_at: string;
  display_name: string | null;
  id: string;
  requester_user_id: string;
};

export type ProfileRow = {
  active_book_id: string | null;
};

export type ProfileDisplayRow = {
  display_name: string;
  id: string;
};
