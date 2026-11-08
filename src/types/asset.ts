import type { AssetKinds } from "../constants/assets";
import type { AssetMovement } from "./assetLink";

export type AssetKind = (typeof AssetKinds)[number]["id"];
export type AssetDraft = {
  kind: AssetKind;
  name: string;
  amount: string;
  date: string;
  quantity: string;
  unitPrice: string;
  share: string;
  note: string;
  institution: string;
  purchasePrice: string;
  averagePrice: string;
  address: string;
  vehicle: string;
  symbol: string;
  rate: string;
  maturity: string;
  repayment: string;
  loanMonths?: string;
  monthlyPayment?: string;
  firstRepaymentDate?: string;
  defaultCashAssetId?: string;
};
export type PersonalAsset = {
  book_id: string;
  is_shared: boolean;
  id: string;
  user_id: string;
  kind: AssetKind;
  name: string;
  note: string;
  deleted_on: string | null;
  created_at: string;
};
export type AssetValuation = {
  id: string;
  asset_id: string;
  user_id: string;
  valued_on: string;
  amount: number;
  details: Partial<AssetDraft>;
  created_at: string;
};
export type AssetPortfolio = {
  assets: PersonalAsset[];
  valuations: AssetValuation[];
  movements?: AssetMovement[];
};
