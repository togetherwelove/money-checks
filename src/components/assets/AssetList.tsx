import { useAppTheme } from "../../hooks/useAppTheme";
import { Pressable, Text, View } from "react-native";
import { Feather } from "../AppIcons";
import { AppSettingsUi } from "../../constants/appSettings";
import { AssetConfig, AssetCopy as Copy } from "../../constants/assets";
import { getAssetStyles } from "../../constants/assetStyles";
import { getAppColors } from "../../constants/colors";
import { AssetLinkCopy } from "../../constants/assetLink";
import type { AssetPortfolio, PersonalAsset } from "../../types/asset";
import {
  assetKind,
  isAssetDebt,
  assetBalance,
  assetActivity,
  formatAssetAmount,
  latestValuation,
} from "../../utils/assets";

export function AssetList({
  portfolio,
  onSelect,
}: {
  portfolio: AssetPortfolio;
  onSelect: (asset: PersonalAsset) => void;
}) {
  useAppTheme();
  const active = portfolio.assets
    .filter((asset) => !asset.deleted_on)
    .sort(
      (left, right) =>
        Number(right.is_shared) - Number(left.is_shared) ||
        left.name.localeCompare(right.name, AssetConfig.locale),
    );
  return (
    <View style={getAssetStyles().section}>
      {active.map((asset) => {
        const value = latestValuation(portfolio.valuations, asset.id);
        const activity = assetActivity(portfolio, asset.id);
        return (
          <Pressable
            key={asset.id}
            accessibilityRole="button"
            accessibilityLabel={`${asset.name}${Copy.separator}${Copy.view}`}
            style={({ pressed }) => [
              getAssetStyles().card,
              getAssetStyles().assetCard,
              isAssetDebt(asset.kind) ? getAssetStyles().debtTint : getAssetStyles().assetTint,
              pressed && getAssetStyles().assetCardPressed,
            ]}
            onPress={() => onSelect(asset)}
          >
            <View style={[getAssetStyles().row, getAssetStyles().assetHeadingRow]}>
              <Text style={[getAssetStyles().text, getAssetStyles().grow]}>{asset.name}</Text>
              <Text style={getAssetStyles().title}>
                {formatAssetAmount(assetBalance(portfolio, asset.id))}
              </Text>
              <Feather
                name="chevron-right"
                size={AppSettingsUi.selectionChevronIconSize}
                color={getAppColors().primary}
              />
            </View>
            <Text style={getAssetStyles().hint}>
              {assetKind(asset.kind).label}
              {Copy.separator}
              {asset.is_shared ? Copy.shared : Copy.private}
              {Copy.separator}
              {activity.date}
              {Copy.separator}
              {activity.automatic ? AssetLinkCopy.automatic : Copy.manual}
              {asset.kind === "property"
                ? `${Copy.separator}${Copy.share} ${value?.details.share}${Copy.percent}`
                : ""}
            </Text>
            <Text style={getAssetStyles().hint}>
              {asset.kind === "cash" || asset.kind === "loan" || asset.kind === "other-debt"
                ? Copy.balanceOn
                : Copy.recordedOn}
              {Copy.separator}
              {value?.valued_on}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
