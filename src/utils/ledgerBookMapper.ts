import type { LedgerBook } from "../types/ledgerBook";
import type { LedgerBookRow } from "../types/supabase";

export function mapLedgerBookRow(row: LedgerBookRow): LedgerBook {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    shareCode: row.share_code,
  };
}
