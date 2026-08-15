import type { LedgerEntry } from "./ledger";

export const LedgerEntryDeleteScopes = {
  installmentGroup: "installment-group",
  single: "single",
} as const;

export type LedgerEntryDeleteScope =
  (typeof LedgerEntryDeleteScopes)[keyof typeof LedgerEntryDeleteScopes];

export type LedgerEntryDeleteHandler = (
  entry: LedgerEntry,
  scope: LedgerEntryDeleteScope,
) => Promise<boolean>;
