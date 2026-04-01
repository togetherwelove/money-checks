export type JoinSharedLedgerBookResult = "joined" | "requested";

export type JoinSharedLedgerBookAttempt = {
  errorMessage: string | null;
  result: JoinSharedLedgerBookResult | null;
};

export type LedgerBookJoinRequest = {
  id: string;
  requestedAt: string;
  requesterDisplayName: string;
  requesterUserId: string;
};
