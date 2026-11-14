import { useAppTheme } from "../../hooks/useAppTheme";
import { Pressable, Text, TextInput, View } from "react-native";
import { AssetLinkCopy as Copy, LoanRepaymentMethods } from "../../constants/assetLink";
import { AssetConfig } from "../../constants/assets";
import { formatDecimalAmountInput } from "../../utils/amount";
import { AssetCopy } from "../../constants/assets";
import { getAssetStyles } from "../../constants/assetStyles";
import { useAssetLinkOptions } from "../../hooks/useAssetLinkOptions";
import type { AssetDraft } from "../../types/asset";
import { EntryDateSelector } from "../EntryDateSelector";
import { AssetLinkMenu } from "./AssetLinkMenu";

export function LoanSettingsFields({
  draft,
  update,
  disabled,
  bookId,
  shared = false,
}: {
  draft: AssetDraft;
  update: (key: keyof AssetDraft, value: string) => void;
  disabled: boolean;
  userId?: string;
  bookId?: string;
  shared?: boolean;
}) {
  useAppTheme();
  const { portfolio, error, retry } = useAssetLinkOptions(bookId);
  return (
    <View style={getAssetStyles().section}>
      <Text style={getAssetStyles().title}>{Copy.settings}</Text>
      <Text style={getAssetStyles().label}>{Copy.paymentQuestion}</Text>
      <View style={getAssetStyles().wrap}>
        {LoanRepaymentMethods.map((method) => (
          <Pressable
            key={method.id}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: (draft.repayment || "manual") === method.id }}
            onPress={() => {
              update("repayment", method.id);
              if (method.id === "annuity" && draft.monthlyPayment === undefined)
                update("monthlyPayment", "");
            }}
            style={[
              getAssetStyles().chip,
              (draft.repayment || "manual") === method.id && getAssetStyles().selected,
            ]}
          >
            <Text
              style={[
                getAssetStyles().text,
                (draft.repayment || "manual") === method.id && getAssetStyles().selectedText,
              ]}
            >
              {method.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={getAssetStyles().hint}>
        {
          (
            LoanRepaymentMethods.find((method) => method.id === draft.repayment) ??
            LoanRepaymentMethods[0]
          ).description
        }
      </Text>
      {draft.repayment && draft.repayment !== "manual" ? (
        <>
          {(
            [
              { key: "rate", label: AssetCopy.rate },
              ...(draft.repayment === "annuity"
                ? [{ key: "monthlyPayment", label: Copy.monthlyPayment }]
                : []),
            ] as const
          ).map((field) => (
            <View key={field.key} style={getAssetStyles().section}>
              <Text style={getAssetStyles().label}>{field.label}</Text>
              <TextInput
                accessibilityLabel={field.label}
                editable={!disabled}
                keyboardType="decimal-pad"
                style={getAssetStyles().input}
                value={formatDecimalAmountInput(
                  draft[field.key as "rate" | "monthlyPayment"] ?? "",
                  AssetConfig.currency,
                )}
                onChangeText={(value) =>
                  update(field.key as "rate" | "monthlyPayment", value.replaceAll(",", ""))
                }
              />
            </View>
          ))}
          {draft.repayment === "equal-principal" ? (
            <>
              {(
                [
                  { key: "firstRepaymentDate", label: Copy.firstDate },
                  { key: "maturity", label: Copy.maturity },
                ] as const
              ).map((field) => (
                <View key={field.key} style={getAssetStyles().section}>
                  <Text style={getAssetStyles().label}>{field.label}</Text>
                  <View pointerEvents={disabled ? "none" : "auto"}>
                    <EntryDateSelector
                      inline
                      compact
                      selectedDate={draft[field.key] || draft.date}
                      onSelectDate={(value) => update(field.key, value)}
                    />
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </>
      ) : null}
      {error ? (
        <Pressable accessibilityRole="button" onPress={retry}>
          <Text style={getAssetStyles().error}>
            {Copy.loadError}
            {Copy.retry}
          </Text>
        </Pressable>
      ) : null}
      <AssetLinkMenu
        label={Copy.defaultCash}
        value={draft.defaultCashAssetId}
        disabled={disabled}
        options={portfolio.assets.filter(
          (asset) => asset.kind === "cash" && !asset.deleted_on && (!shared || asset.is_shared),
        )}
        onChange={(id) => update("defaultCashAssetId", id ?? "")}
      />
      <Text style={getAssetStyles().hint}>{Copy.estimate}</Text>
    </View>
  );
}
