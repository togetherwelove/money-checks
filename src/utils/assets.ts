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
    !validAssetDate(draft.date) ||
    draft.date < AssetConfig.earliestDate ||
    draft.date > assetToday() ||
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
export function latestValuation(
  valuations: AssetValuation[],
  assetId: string,
  date = assetToday(),
) {
  let latest: AssetValuation | undefined;
  for (const value of valuations) {
    if (value.asset_id !== assetId || value.valued_on > date) continue;
    if (
      !latest ||
      value.valued_on > latest.valued_on ||
      (value.valued_on === latest.valued_on && value.created_at > latest.created_at)
    )
      latest = value;
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
export function assetBalance(
  portfolio: AssetPortfolio,
  assetId: string,
  date = assetToday(),
  excludeEntryId?: string,
) {
  const baseline = latestValuation(portfolio.valuations, assetId, date);
  if (!baseline) return 0;
  let balance = new BalanceDecimal(baseline.amount);
  for (const movement of portfolio.movements ?? []) {
    if (
      movement.asset_id !== assetId ||
      movement.entry_id === excludeEntryId ||
      movement.occurred_on > date
    )
      continue;
    if (
      movement.occurred_on > baseline.valued_on ||
      (movement.occurred_on === baseline.valued_on && movement.created_at > baseline.created_at)
    )
      balance = balance.plus(movement.amount);
  }
  return balance.toDecimalPlaces(AssetLinkConfig.moneyDecimals).toNumber();
}
export function assetActivity(portfolio: AssetPortfolio, assetId: string, date = assetToday()) {
  const baseline = latestValuation(portfolio.valuations, assetId, date);
  let latestDate = baseline?.valued_on ?? "",
    stamp = baseline?.created_at ?? "",
    automatic = false;
  for (const movement of portfolio.movements ?? []) {
    if (movement.asset_id !== assetId || movement.occurred_on > date) continue;
    if (
      movement.occurred_on > latestDate ||
      (movement.occurred_on === latestDate && movement.created_at > stamp)
    ) {
      latestDate = movement.occurred_on;
      stamp = movement.created_at;
      automatic = true;
    }
  }
  return { date: latestDate, automatic };
}
export function portfolioSummary(portfolio: AssetPortfolio, date = assetToday()) {
  let total = new BalanceDecimal(0),
    debt = new BalanceDecimal(0);
  for (const asset of portfolio.assets) {
    if (asset.deleted_on && asset.deleted_on <= date) continue;
    const value = assetBalance(portfolio, asset.id, date);
    if (isAssetDebt(asset.kind)) debt = debt.plus(value);
    else total = total.plus(value);
  }
  return {
    total: total.toNumber(),
    debt: debt.toNumber(),
    net: total.minus(debt).toDecimalPlaces(AssetLinkConfig.moneyDecimals).toNumber(),
  };
}
export function portfolioTrend(portfolio: AssetPortfolio, today = assetToday()) {
  const firstDate = portfolio.valuations.reduce(
    (first, value) => (value.valued_on < first ? value.valued_on : first),
    today,
  );
  const current = new Date(`${today}T12:00:00`);
  return Array.from({ length: AssetConfig.trendMonths }, (_, index) => {
    const monthEnd = new Date(current.getFullYear(), current.getMonth() - index + 1, 0);
    const date =
      index === 0
        ? today
        : `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;
    const active = portfolio.assets.filter((asset) => !asset.deleted_on || asset.deleted_on > date);
    const confirmed = active.filter(
      (asset) =>
        latestValuation(portfolio.valuations, asset.id, date)?.valued_on.slice(0, 7) ===
        date.slice(0, 7),
    ).length;
    return { date, confirmed, count: active.length, ...portfolioSummary(portfolio, date) };
  })
    .filter((point) => point.date >= firstDate)
    .reverse();
}

const currencyFormat = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: AssetConfig.currency,
  maximumFractionDigits: 2,
});
export function formatAssetAmount(value: number) {
  return currencyFormat.format(value);
}
