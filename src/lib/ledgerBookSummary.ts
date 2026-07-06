import type { LedgerTotalSummary } from "../types/ledger";
import { supabase } from "./supabase";

const GET_LEDGER_BOOK_TOTAL_SUMMARY_FUNCTION = "get_ledger_book_total_summary";

type LedgerBookTotalSummaryRpcRow = {
  total_expense_amount: number | string;
  total_income_amount: number | string;
};

type LedgerBookTotalSummaryFilter = {
  dateFrom?: string | null;
  dateTo?: string | null;
};

export async function fetchLedgerBookTotalSummary(
  bookId: string,
  filter: LedgerBookTotalSummaryFilter = {},
): Promise<LedgerTotalSummary> {
  const { data, error } = await supabase
    .rpc(GET_LEDGER_BOOK_TOTAL_SUMMARY_FUNCTION, {
      p_book_id: bookId,
      p_date_from: filter.dateFrom ?? null,
      p_date_to: filter.dateTo ?? null,
    })
    .maybeSingle<LedgerBookTotalSummaryRpcRow>();

  if (error) {
    throw error;
  }

  const totalIncome = toAmountNumber(data?.total_income_amount);
  const totalExpense = toAmountNumber(data?.total_expense_amount);

  return {
    balance: totalIncome - totalExpense,
    totalExpense,
    totalIncome,
  };
}

function toAmountNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value) || 0;
  }

  return 0;
}
