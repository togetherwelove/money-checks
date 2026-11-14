import { useAppTheme } from "../../hooks/useAppTheme";
import { Pressable, Text, TextInput, View } from "react-native";
import { AssetConfig, AssetCopy as Copy } from "../../constants/assets";
import { AppSettingsUi } from "../../constants/appSettings";
import { getAssetStyles } from "../../constants/assetStyles";
import { getAppColors } from "../../constants/colors";
import type { AssetDraft } from "../../types/asset";
import { assetAmount, formatAssetAmount, isAssetDebt } from "../../utils/assets";
import { EntryDateSelector } from "../EntryDateSelector";
import { Feather } from "../AppIcons";
import { LoanSettingsFields } from "./LoanSettingsFields";
import { formatDecimalAmountInput } from "../../utils/amount";

type Field = { key: keyof AssetDraft; label: string; numeric?: boolean };
export function AssetDraftFields({
  draft,
  update,
  disabled,
  expanded,
  onToggleDetails,
  userId,
  bookId,
  shared = false,
}: {
  draft: AssetDraft;
  update: (key: keyof AssetDraft, value: string) => void;
  disabled: boolean;
  expanded: boolean;
  onToggleDetails: () => void;
  userId?: string;
  bookId?: string;
  shared?: boolean;
}) {
  const colorScheme = useAppTheme();
  function field({ key, label, numeric = false }: Field) {
    return (
      <View key={key} style={getAssetStyles().section}>
        <Text style={getAssetStyles().label}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          style={getAssetStyles().input}
          value={
            numeric && draft[key]
              ? formatDecimalAmountInput(draft[key], AssetConfig.currency)
              : draft[key]
          }
          placeholder={key === "name" ? Copy.contentExamples[draft.kind] : undefined}
          editable={!disabled}
          keyboardType={numeric ? "decimal-pad" : "default"}
          keyboardAppearance={colorScheme}
          maxLength={
            key === "name"
              ? AssetConfig.nameMaxLength
              : key === "note"
                ? AssetConfig.noteMaxLength
                : AssetConfig.detailMaxLength
          }
          multiline={key === "note"}
          onChangeText={(value) => update(key, numeric ? value.replaceAll(",", "") : value)}
        />
      </View>
    );
  }
  const amount = assetAmount(draft);
  const additional: Field[] = [];
  if (["cash", "loan", "other-debt"].includes(draft.kind))
    additional.push({ key: "institution", label: Copy.institution });
  if (["property", "car", "other"].includes(draft.kind))
    additional.push({ key: "purchasePrice", label: Copy.purchasePrice, numeric: true });
  if (draft.kind === "property") additional.push({ key: "address", label: Copy.address });
  if (draft.kind === "car") additional.push({ key: "vehicle", label: Copy.vehicle });
  if (draft.kind === "other-debt")
    additional.push(
      { key: "rate", label: Copy.rate, numeric: true },
      { key: "repayment", label: Copy.repayment },
    );
  if (["cash", "other-debt"].includes(draft.kind))
    additional.push({ key: "maturity", label: Copy.maturity });
  return (
    <>
      <Text style={getAssetStyles().label}>{Copy.date}</Text>
      <View pointerEvents={disabled ? "none" : "auto"}>
        <EntryDateSelector
          inline
          compact
          selectedDate={draft.date}
          onSelectDate={(value) => update("date", value)}
        />
      </View>
      {field({ key: "name", label: Copy.content })}
      {field({
        key: "amount",
        label: isAssetDebt(draft.kind)
          ? Copy.remaining
          : draft.kind === "property"
            ? Copy.totalProperty
            : draft.kind === "stock"
              ? Copy.accountAmount
              : ["car", "other"].includes(draft.kind)
                ? Copy.valuationAmount
                : Copy.amount,
        numeric: true,
      })}
      {draft.kind === "stock" ? <Text style={getAssetStyles().hint}>{Copy.stockHint}</Text> : null}
      {["property", "car", "other"].includes(draft.kind) ? (
        <Text style={getAssetStyles().hint}>{Copy.valuationHint}</Text>
      ) : null}
      {draft.kind === "cash" ? <Text style={getAssetStyles().hint}>{Copy.cashHint}</Text> : null}
      {draft.kind === "property" ? (
        <>
          {field({ key: "share", label: Copy.share, numeric: true })}
          <Text style={getAssetStyles().hint}>{Copy.propertyHint}</Text>
        </>
      ) : null}
      {isAssetDebt(draft.kind) ? <Text style={getAssetStyles().hint}>{Copy.debtHint}</Text> : null}
      {Number.isFinite(amount) ? (
        <View style={getAssetStyles().row}>
          <Text style={getAssetStyles().label}>{Copy.reflected}</Text>
          <Text
            style={isAssetDebt(draft.kind) ? getAssetStyles().debtHeading : getAssetStyles().title}
          >
            {formatAssetAmount(isAssetDebt(draft.kind) ? -amount : amount)}
          </Text>
        </View>
      ) : null}
      {draft.kind === "loan" ? (
        <LoanSettingsFields
          draft={draft}
          update={update}
          disabled={disabled}
          userId={userId}
          bookId={bookId}
          shared={shared}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        disabled={disabled}
        onPress={onToggleDetails}
        style={getAssetStyles().row}
      >
        <Text style={getAssetStyles().action}>{expanded ? Copy.collapse : Copy.details}</Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={AppSettingsUi.selectionChevronIconSize}
          color={getAppColors().primary}
        />
      </Pressable>
      {expanded ? (
        <>
          {additional.map(field)}
          {field({ key: "note", label: Copy.note })}
        </>
      ) : null}
    </>
  );
}
