import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { LedgerRealtimeConfig } from "../constants/ledgerQueries";
import type { LedgerEntryRow } from "../types/supabase";
import { supabase } from "./supabase";

export type LedgerEntryRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

type LedgerEntryRealtimeSubscriptionParams = {
  bookId: string;
  channelScope: string;
  onChange: (payload: LedgerEntryRealtimePayload) => void;
};

export function subscribeToLedgerEntryChanges({
  bookId,
  channelScope,
  onChange,
}: LedgerEntryRealtimeSubscriptionParams): () => void {
  const channel = supabase
    .channel(`${LedgerRealtimeConfig.ledgerEntriesChannelPrefix}-${channelScope}-${bookId}`)
    .on(
      LedgerRealtimeConfig.postgresChangesEvent,
      {
        event: LedgerRealtimeConfig.ledgerEntriesAllEvents,
        schema: LedgerRealtimeConfig.publicSchema,
        table: LedgerRealtimeConfig.ledgerEntriesTable,
        filter: `${LedgerRealtimeConfig.ledgerEntriesBookIdFilterColumn}=eq.${bookId}`,
      },
      (payload) => {
        onChange(payload as LedgerEntryRealtimePayload);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function resolveDeletedLedgerEntryId(payload: LedgerEntryRealtimePayload): string | null {
  const deletedRow = payload.old as Partial<Record<string, unknown>>;
  return typeof deletedRow.id === "string" ? deletedRow.id : null;
}

export function resolveChangedLedgerEntryRow(payload: LedgerEntryRealtimePayload): LedgerEntryRow {
  return payload.new as LedgerEntryRow;
}
