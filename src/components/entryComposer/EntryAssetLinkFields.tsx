import { useEffect, useRef } from "react";
import { randomUUID } from "expo-crypto";
import { Pressable, Text, TextInput, View } from "react-native";
import { AssetLinkConfig as Config, AssetLinkCopy as Copy } from "../../constants/assetLink";
import { AssetStyles as styles } from "../../constants/assetStyles";
import { useAssetLinkOptions } from "../../hooks/useAssetLinkOptions";
import type { useEntryComposer } from "../../hooks/useEntryComposer";
import { assetBalance, formatAssetAmount, latestValuation } from "../../utils/assets";
import {
  entryAssetLinkError,
  estimateLoanFromSettings,
  repaymentInterest,
} from "../../utils/loanRepayment";
import { AssetLinkMenu } from "../assets/AssetLinkMenu";
import { resolveDisplayCurrency } from "../../lib/currencyPreference";
import { AssetCopy } from "../../constants/assets";
import { AssetConfig } from "../../constants/assets";

export function EntryAssetLinkFields({
  composer,
  visible,
  bookId,
  disabled = false,
  editingEntryId,
}: {
  composer: ReturnType<typeof useEntryComposer>;
  visible: boolean;
  bookId: string | null;
  disabled?: boolean;
  editingEntryId?: string;
}) {
  const { draft, userId, members, update } = composer;
  const canLinkAssets = members.some((member) => member.userId === userId);
  const { portfolio, error, retry } = useAssetLinkOptions(
    bookId ?? undefined,
    canLinkAssets && visible,
  );
  const link = draft.assetLink;
  const cash = portfolio.assets.filter((asset) => asset.kind === "cash" && !asset.deleted_on);
  const loans = portfolio.assets.filter((asset) => asset.kind === "loan" && !asset.deleted_on);
  const repayment = draft.categoryId === Config.loanCategoryId && draft.type === "expense";
  function change(values: Partial<NonNullable<typeof link>>) {
    update("assetLink", {
      requestId: link?.requestId || randomUUID(),
      cashAssetId: null,
      loanAssetId: null,
      principal: "0",
      fee: "0",
      ...link,
      ...values,
    });
  }
  function selectLoan(id: string | null) {
    const selectedLoan = loans.find((loan) => loan.id === id);
    const previousLoan = loans.find((loan) => loan.id === link?.loanAssetId);
    if (selectedLoan && (!draft.content.trim() || draft.content === previousLoan?.name)) {
      update("content", selectedLoan.name);
    }
    const settings = id
      ? latestValuation(portfolio.valuations, id, draft.date)?.details
      : undefined;
    const estimate =
      id && settings
        ? estimateLoanFromSettings(
            assetBalance(portfolio, id, draft.date, editingEntryId),
            settings,
            draft.date,
          )
        : null;
    if (estimate && !draft.amount) update("amount", estimate.total);
    change({
      loanAssetId: id,
      principal: estimate
        ? draft.amount
          ? Math.max(0, Number(draft.amount) - Number(estimate.interest)).toFixed(
              Config.moneyDecimals,
            )
          : estimate.principal
        : id
          ? ""
          : "0",
      fee: "0",
      cashAssetId:
        settings?.defaultCashAssetId &&
        cash.some((asset) => asset.id === settings.defaultCashAssetId)
          ? settings.defaultCashAssetId
          : (link?.cashAssetId ?? null),
    });
  }
  const autoSelected = useRef(false);
  useEffect(() => {
    if (!repayment) {
      autoSelected.current = false;
      return;
    }
    if (
      !visible ||
      disabled ||
      editingEntryId ||
      !canLinkAssets ||
      error ||
      resolveDisplayCurrency() !== AssetConfig.currency ||
      draft.installmentMonths > 1 ||
      autoSelected.current
    )
      return;
    if (link?.loanAssetId) {
      autoSelected.current = true;
      return;
    }
    if (loans.length !== 1 || !latestValuation(portfolio.valuations, loans[0].id, draft.date))
      return;
    autoSelected.current = true;
    selectLoan(loans[0].id);
  }, [
    repayment,
    visible,
    disabled,
    editingEntryId,
    canLinkAssets,
    error,
    draft,
    link,
    loans,
    portfolio,
    selectLoan,
  ]);
  if (resolveDisplayCurrency() !== AssetConfig.currency)
    return repayment || link ? <Text style={styles.hint}>{Copy.currency}</Text> : null;
  if (!canLinkAssets)
    return link ? (
      <View style={styles.section}>
        <Text style={styles.hint}>{Copy.personalOnly}</Text>
        <Text style={styles.hint}>{Copy.disconnectHint}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => update("assetLink", undefined)}
          style={styles.row}
        >
          <Text style={styles.action}>{Copy.disconnect}</Text>
        </Pressable>
      </View>
    ) : null;
  if (
    link &&
    [link.cashAssetId, link.loanAssetId].some(
      (id) => id && !portfolio.assets.some((asset) => asset.id === id),
    ) &&
    !error
  )
    return <Text style={styles.hint}>{AssetCopy.privateLink}</Text>;
  if (!cash.length && !loans.length && !error && !link) return null;
  const valuation = link?.loanAssetId
    ? latestValuation(portfolio.valuations, link.loanAssetId, draft.date)
    : undefined;
  const balance = link?.loanAssetId
    ? assetBalance(portfolio, link.loanAssetId, draft.date, editingEntryId)
    : 0;
  const details = valuation?.details;
  const suggestion = details ? estimateLoanFromSettings(balance, details, draft.date) : null;
  return (
    <View style={styles.section} pointerEvents={disabled ? "none" : "auto"}>
      {error ? (
        <Pressable accessibilityRole="button" onPress={retry}>
          <Text style={styles.error}>
            {Copy.loadError}
            {Copy.retry}
          </Text>
        </Pressable>
      ) : null}
      {draft.installmentMonths > 1 ? (
        <Text style={styles.hint}>{Copy.oneTime}</Text>
      ) : (
        <>
          {cash.length || link?.cashAssetId ? (
            <AssetLinkMenu
              label={draft.type === "income" ? Copy.deposit : Copy.withdrawal}
              value={link?.cashAssetId}
              options={cash}
              disabled={disabled}
              onChange={(id) => change({ cashAssetId: id })}
            />
          ) : null}
          {repayment ? (
            <>
              <AssetLinkMenu
                label={Copy.loan}
                value={link?.loanAssetId}
                options={loans}
                disabled={disabled}
                onChange={selectLoan}
              />
              {link?.loanAssetId ? (
                <>
                  {suggestion ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={disabled}
                      style={styles.row}
                      onPress={() => {
                        const principal = draft.amount
                          ? Math.max(
                              0,
                              Number(draft.amount) -
                                Number(suggestion.interest) -
                                Number(link.fee || 0),
                            ).toFixed(Config.moneyDecimals)
                          : suggestion.principal;
                        if (!draft.amount) update("amount", suggestion.total);
                        change({ principal });
                      }}
                    >
                      <Text style={styles.action}>{Copy.suggest}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.hint}>{Copy.manual}</Text>
                  )}
                  {[
                    { key: "principal", label: Copy.principal },
                    { key: "fee", label: Copy.fee },
                  ].map((field) => (
                    <View key={field.key} style={styles.section}>
                      <Text style={styles.label}>{field.label}</Text>
                      <TextInput
                        accessibilityLabel={field.label}
                        keyboardType="decimal-pad"
                        clearButtonMode="while-editing"
                        editable={!disabled}
                        value={link[field.key as "principal" | "fee"]}
                        style={styles.input}
                        onChangeText={(value) => change({ [field.key]: value })}
                      />
                    </View>
                  ))}
                  <View style={styles.row}>
                    <Text style={styles.label}>{Copy.interest}</Text>
                    <Text style={styles.text}>{repaymentInterest(draft)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>{Copy.after}</Text>
                    <Text style={styles.text}>
                      {formatAssetAmount(balance - Number(link.principal || 0))}
                    </Text>
                  </View>
                  <Text style={styles.hint}>{Copy.estimate}</Text>
                  {!link.cashAssetId ? <Text style={styles.hint}>{Copy.noCash}</Text> : null}
                </>
              ) : null}
            </>
          ) : null}
        </>
      )}
      {entryAssetLinkError(draft, portfolio, editingEntryId, members.length <= 1) ? (
        <Text style={styles.error}>
          {entryAssetLinkError(draft, portfolio, editingEntryId, members.length <= 1)}
        </Text>
      ) : null}
    </View>
  );
}
