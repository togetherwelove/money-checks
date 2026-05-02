import type { AccessibleLedgerBook, LedgerBook } from "../types/ledgerBook";
import type { AccessibleLedgerBookRow, LedgerBookRow } from "../types/supabase";

export function mapLedgerBookRow(row: LedgerBookRow): LedgerBook {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    shareCode: row.share_code,
  };
}

export function mapAccessibleLedgerBookRow(row: AccessibleLedgerBookRow): AccessibleLedgerBook {
  return {
    ...mapLedgerBookRow(row),
    role: row.member_role,
  };
}
