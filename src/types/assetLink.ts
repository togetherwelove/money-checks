export type EntryAssetLink = {
  requestId: string;
  cashAssetId: string | null;
  loanAssetId: string | null;
  principal: string;
  fee: string;
};
export type AssetMovement = {
  asset_id: string;
  entry_id: string;
  user_id: string;
  amount: number;
  occurred_on: string;
  created_at: string;
};
