import { AssetConfig, AssetCopy, AssetKinds } from "../constants/assets";
import Decimal from "decimal.js";
import { AssetLinkConfig } from "../constants/assetLink";
import type {
  AssetDraft,
  AssetKind,
  AssetPortfolio,
  AssetValuation,
  PersonalAsset,
} from "../types/asset";

const BalanceDecimal = Decimal.clone({ precision: AssetLinkConfig.calculationPrecision });

export function assetToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function createAssetDraft(kind: AssetKind = "cash"): AssetDraft {
  return {
    kind,
    name: "",
    amount: "",
    date: assetToday(),
    quantity: "",
    unitPrice: "",
    share: String(AssetConfig.percentBase),
    note: "",
    institution: "",
    purchasePrice: "",
    averagePrice: "",
    address: "",
    vehicle: "",
    symbol: "",
    rate: "",
    maturity: "",
    repayment: "",
    loanMonths: "",
    firstRepaymentDate: assetToday(),
    defaultCashAssetId: "",
  };
}

function numberValue(value: string) {
  return /^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : Number.NaN;
}

export function assetAmount(draft: AssetDraft) {
  const amount =
    draft.kind === "stock" && !draft.amount.trim()
      ? numberValue(draft.quantity) * numberValue(draft.unitPrice)
      : draft.kind === "property"
        ? (numberValue(draft.amount) * numberValue(draft.share)) / AssetConfig.percentBase
        : numberValue(draft.amount);
  return Math.round(amount * AssetConfig.amountScale) / AssetConfig.amountScale;
}

export function validAssetDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return (
    Number.isFinite(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` ===
      value
  );
}

export function assetDraftError(draft: AssetDraft): string | null {
  const amount = assetAmount(draft);
  if (
    !AssetKinds.some((kind) => kind.id === draft.kind) ||
    !draft.name.trim() ||
    draft.name.length > AssetConfig.nameMaxLength ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > AssetConfig.maximumAmount ||
    (draft.kind === "stock" &&
      !draft.amount.trim() &&
      (numberValue(draft.quantity) > AssetConfig.maximumQuantity ||
        numberValue(draft.unitPrice) > AssetConfig.maximumAmount)) ||
    (draft.kind === "property" &&
      (!(numberValue(draft.share) > 0) ||
        numberValue(draft.share) > AssetConfig.percentBase ||
        numberValue(draft.amount) > AssetConfig.maximumAmount))
  )
    return AssetCopy.invalid;
  if (
    draft.note.length > AssetConfig.noteMaxLength ||
    [draft.purchasePrice, draft.averagePrice].some(
      (value) =>
        value !== "" &&
        (!Number.isFinite(numberValue(value)) || numberValue(value) > AssetConfig.maximumAmount),
    ) ||
    (draft.rate !== "" &&
      (!Number.isFinite(numberValue(draft.rate)) ||
        numberValue(draft.rate) > AssetConfig.percentBase)) ||
    (draft.maturity !== "" && !validAssetDate(draft.maturity))
  )
    return AssetCopy.optionalInvalid;
  return null;
}

export function assetKind(kind: AssetKind) {
  return AssetKinds.find((item) => item.id === kind) ?? AssetKinds[0];
}
export function isAssetDebt(kind: AssetKind) {
  return assetKind(kind).group === "debt";
}
export function latestValuation(valuations: AssetValuation[], assetId: string) {
  let latest: AssetValuation | undefined;
  for (const value of valuations) {
    if (value.asset_id !== assetId) continue;
    if (!latest || value.created_at > latest.created_at) latest = value;
  }
  return latest;
}
export function draftFromAsset(asset: PersonalAsset, valuation: AssetValuation): AssetDraft {
  return {
    ...createAssetDraft(asset.kind),
    ...valuation.details,
    ...(asset.kind === "stock"
      ? {
          amount: String(valuation.amount),
          quantity: "",
          unitPrice: "",
          averagePrice: "",
          symbol: "",
        }
      : {}),
    kind: asset.kind,
    name: asset.name,
    note: asset.note,
    date: assetToday(),
  };
}
export function assetBalance(portfolio: AssetPortfolio, assetId: string, excludeEntryId?: string) {
  const asset = portfolio.assets.find((item) => item.id === assetId);
  let balance = new BalanceDecimal(asset?.current_balance ?? 0);
  if (excludeEntryId) {
    for (const movement of portfolio.movements ?? []) {
      if (movement.asset_id === assetId && movement.entry_id === excludeEntryId)
        balance = balance.minus(movement.amount);
    }
  }
  return balance.toDecimalPlaces(AssetLinkConfig.moneyDecimals).toNumber();
}

export function portfolioSummary(portfolio: AssetPortfolio) {
  let total = new BalanceDecimal(0),
    debt = new BalanceDecimal(0);
  for (const asset of portfolio.assets) {
    if (asset.deleted_on) continue;
    if (isAssetDebt(asset.kind)) debt = debt.plus(asset.current_balance);
    else total = total.plus(asset.current_balance);
  }
  return {
    total: total.toNumber(),
    debt: debt.toNumber(),
    net: total.minus(debt).toDecimalPlaces(AssetLinkConfig.moneyDecimals).toNumber(),
  };
}

const currencyFormat = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: AssetConfig.currency,
  maximumFractionDigits: 2,
});
export function formatAssetAmount(value: number) {
  return currencyFormat.format(value);
}
