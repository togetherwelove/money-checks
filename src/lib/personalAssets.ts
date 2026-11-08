import { AssetConfig } from "../constants/assets";
import type { AssetDraft, AssetPortfolio, AssetValuation, PersonalAsset } from "../types/asset";
import type { AssetMovement } from "../types/assetLink";
import { loanSettingsError } from "../utils/loanRepayment";
import { assetDraftError, assetToday } from "../utils/assets";
import { supabase } from "./supabase";
import { logAppError } from "./logAppError";

const AssetTableOrderColumns = {
  personal_assets: ["id"],
  personal_asset_valuations: ["id"],
  ledger_asset_movements: ["asset_id", "entry_id"],
} as const;

async function readAllRows<T>(
  table: keyof typeof AssetTableOrderColumns,
  bookId: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += AssetConfig.historyPageSize) {
    let query = supabase.from(table).select("*").eq("book_id", bookId);
    for (const column of AssetTableOrderColumns[table]) query = query.order(column);
    const { data, error } = await query.range(offset, offset + AssetConfig.historyPageSize - 1);
    if (error) {
      logAppError("PersonalAssets", { code: error.code, message: error.message }, { table });
      throw error;
    }
    rows.push(...(data as T[]));
    if (data.length < AssetConfig.historyPageSize) return rows;
  }
}
export async function fetchPersonalAssets(bookId: string): Promise<AssetPortfolio> {
  const [assets, valuations, movements] = await Promise.all([
    readAllRows<PersonalAsset>("personal_assets", bookId),
    readAllRows<AssetValuation>("personal_asset_valuations", bookId),
    readAllRows<AssetMovement>("ledger_asset_movements", bookId),
  ]);
  return { assets, valuations, movements };
}
export async function savePersonalAsset(
  id: string | null,
  draft: AssetDraft,
  bookId: string,
  shared = false,
) {
  const validation = assetDraftError(draft) ?? loanSettingsError(draft);
  if (validation) throw new Error(validation);
  const { error } = await supabase.rpc("save_personal_asset", {
    p_id: id,
    p_book: bookId,
    p_shared: shared,
    p_kind: draft.kind,
    p_name: draft.name.trim(),
    p_note: draft.note,
    p_date: draft.date,
    p_details: draft,
  });
  if (error) throw error;
}
export async function deletePersonalAsset(id: string) {
  const { error } = await supabase.rpc("delete_personal_asset", { p_id: id, p_date: assetToday() });
  if (error) throw error;
}
