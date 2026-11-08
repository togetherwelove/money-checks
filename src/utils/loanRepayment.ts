import Decimal from "decimal.js";
import { AssetConfig } from "../constants/assets";
import { AssetLinkConfig as Config, AssetLinkCopy as Copy } from "../constants/assetLink";
import type { AssetDraft, AssetPortfolio } from "../types/asset";
import type { LedgerEntryDraft } from "../types/ledger";
import { assetToday, validAssetDate, assetBalance } from "./assets";

const Money = Decimal.clone({
  precision: Config.calculationPrecision,
  rounding: Decimal.ROUND_HALF_UP,
});
export function loanSettingsError(draft: AssetDraft) {
  if (draft.kind !== "loan" || !["annuity", "equal-principal"].includes(draft.repayment))
    return null;
  const invalidRate =
    draft.rate === "" ||
    !Number.isFinite(Number(draft.rate)) ||
    Number(draft.rate) < 0 ||
    Number(draft.rate) > Config.percentBase;
  if (invalidRate) return Copy.settingsInvalid;
  if (draft.repayment === "annuity" && draft.monthlyPayment !== undefined) {
    const payment = Number(draft.monthlyPayment);
    return !Number.isFinite(payment) || payment <= 0 || payment > AssetConfig.maximumAmount
      ? Copy.settingsInvalid
      : null;
  }
  const months = remainingLoanMonths(draft, draft.firstRepaymentDate ?? "");
  return !validAssetDate(draft.firstRepaymentDate ?? "") ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > Config.maximumMonths ||
    (draft.maturity !== "" &&
      (!validAssetDate(draft.maturity) || draft.maturity < (draft.firstRepaymentDate ?? "")))
    ? Copy.settingsInvalid
    : null;
}

export function estimateLoanPayment(
  balance: number,
  annualRate: string,
  months: number,
  method: string,
) {
  if (
    !Number.isFinite(balance) ||
    balance <= 0 ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > Config.maximumMonths ||
    annualRate.trim() === "" ||
    !Number.isFinite(Number(annualRate)) ||
    Number(annualRate) < 0 ||
    Number(annualRate) > Config.percentBase ||
    !["annuity", "equal-principal"].includes(method)
  )
    return null;
  const outstanding = new Money(balance);
  const rate = new Money(annualRate).div(Config.percentBase).div(Config.monthsPerYear);
  const interest = outstanding.mul(rate).toDecimalPlaces(Config.moneyDecimals);
  const payment = rate.isZero()
    ? outstanding.div(months)
    : outstanding.mul(rate).div(new Money(1).minus(rate.plus(1).pow(-months)));
  const principal = Money.min(
    outstanding,
    (method === "equal-principal"
      ? outstanding.div(months)
      : payment.minus(interest)
    ).toDecimalPlaces(Config.moneyDecimals),
  );
  return {
    principal: principal.toFixed(),
    interest: interest.toFixed(),
    total: principal.plus(interest).toFixed(),
  };
}

export function remainingLoanMonths(details: Partial<AssetDraft>, date: string) {
  if (
    !details.firstRepaymentDate ||
    !validAssetDate(details.firstRepaymentDate) ||
    date < details.firstRepaymentDate
  )
    return 0;
  if (details.maturity) {
    if (!validAssetDate(details.maturity) || date > details.maturity) return 0;
    const [endYear, endMonth] = details.maturity.split("-").map(Number);
    const [year, month] = date.split("-").map(Number);
    return (endYear - year) * Config.monthsPerYear + endMonth - month + 1;
  }
  const [year, month] = date.split("-").map(Number);
  const [firstYear, firstMonth] = details.firstRepaymentDate.split("-").map(Number);
  return Math.max(
    0,
    Number(details.loanMonths ?? 0) -
      ((year - firstYear) * Config.monthsPerYear + month - firstMonth),
  );
}
export function repaymentInterest(draft: Pick<LedgerEntryDraft, "amount" | "assetLink">) {
  try {
    return new Money(draft.amount || 0)
      .minus(draft.assetLink?.principal || 0)
      .minus(draft.assetLink?.fee || 0)
      .toDecimalPlaces(Config.moneyDecimals)
      .toFixed();
  } catch {
    return "";
  }
}
export function entryAssetLinkError(
  draft: LedgerEntryDraft,
  portfolio?: AssetPortfolio,
  excludeEntryId?: string,
  requireLoan = true,
) {
  const link = draft.assetLink;
  if (requireLoan && draft.categoryId === Config.loanCategoryId && !link?.loanAssetId)
    return Copy.loanRequired;
  if (!link?.cashAssetId && !link?.loanAssetId)
    return requireLoan && draft.categoryId === Config.loanCategoryId ? Copy.loanRequired : null;
  if (draft.installmentMonths > 1 || draft.date > assetToday()) return Copy.oneTime;
  if (
    !link.requestId ||
    (link.loanAssetId && (draft.type !== "expense" || draft.categoryId !== Config.loanCategoryId))
  )
    return Copy.invalid;
  if (
    portfolio &&
    [link.cashAssetId, link.loanAssetId].some(
      (id) =>
        id &&
        !portfolio.assets.some(
          (asset) =>
            asset.id === id &&
            !asset.deleted_on &&
            asset.kind === (id === link.cashAssetId ? "cash" : "loan"),
        ),
    )
  )
    return Copy.unavailable;
  if (link.loanAssetId) {
    if (
      !/^\d+(\.\d{1,2})?$/.test(link.principal) ||
      !/^\d+(\.\d{1,2})?$/.test(link.fee) ||
      Number(repaymentInterest(draft)) < 0 ||
      repaymentInterest(draft) === ""
    )
      return Copy.invalid;
  }
  if (
    portfolio &&
    ((link.cashAssetId &&
      draft.type === "expense" &&
      Number(draft.amount) >
        assetBalance(portfolio, link.cashAssetId, draft.date, excludeEntryId)) ||
      (link.loanAssetId &&
        Number(link.principal) >
          assetBalance(portfolio, link.loanAssetId, draft.date, excludeEntryId)))
  )
    return Copy.balanceError;
  return null;
}

export function estimateLoanFromSettings(
  balance: number,
  details: Partial<AssetDraft>,
  date: string,
) {
  if (details.repayment !== "annuity" || details.monthlyPayment === undefined)
    return estimateLoanPayment(
      balance,
      details.rate ?? "",
      remainingLoanMonths(details, date),
      details.repayment ?? "",
    );
  const payment = Number(details.monthlyPayment);
  const rate = Number(details.rate);
  if (
    !Number.isFinite(balance) ||
    balance <= 0 ||
    !details.rate?.trim() ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > Config.percentBase ||
    !Number.isFinite(payment) ||
    payment <= 0 ||
    payment > AssetConfig.maximumAmount
  )
    return null;
  const interest = new Money(balance)
    .mul(rate)
    .div(Config.percentBase)
    .div(Config.monthsPerYear)
    .toDecimalPlaces(Config.moneyDecimals);
  if (interest.greaterThanOrEqualTo(payment)) return null;
  const principal = Money.min(balance, new Money(payment).minus(interest)).toDecimalPlaces(
    Config.moneyDecimals,
  );
  return {
    principal: principal.toFixed(),
    interest: interest.toFixed(),
    total: principal.plus(interest).toFixed(),
  };
}

export function editableLoanSettings(draft: AssetDraft): AssetDraft {
  if (draft.kind !== "loan") return draft;
  if (draft.repayment === "annuity" && draft.monthlyPayment === undefined) {
    const estimate = estimateLoanFromSettings(Number(draft.amount), draft, draft.date);
    return { ...draft, monthlyPayment: estimate?.total ?? "" };
  }
  if (
    draft.repayment !== "equal-principal" ||
    draft.maturity ||
    !validAssetDate(draft.firstRepaymentDate ?? "")
  )
    return draft;
  const [year, month, day] = draft.firstRepaymentDate!.split("-").map(Number);
  const months = Number(draft.loanMonths);
  if (!Number.isInteger(months) || months < 1 || months > Config.maximumMonths) return draft;
  const end = new Date(year, month + months - 2, 1);
  const endDay = Math.min(day, new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate());
  const maturity = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  return { ...draft, maturity };
}
