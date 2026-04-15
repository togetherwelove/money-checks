import type { LedgerBook } from "./ledgerBook";

export type JoinSharedLedgerBookResult = "joined" | "requested";

export type JoinSharedLedgerBookAttempt = {
  book: LedgerBook | null;
  errorMessage: string | null;
  result: JoinSharedLedgerBookResult | null;
};

export type LedgerBookJoinRequest = {
  id: string;
  requestedAt: string;
  requesterDisplayName: string;
  requesterUserId: string;
};
