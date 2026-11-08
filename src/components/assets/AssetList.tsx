import { Pressable, Text, View } from "react-native";
import { Feather } from "../AppIcons";
import { AppSettingsUi } from "../../constants/appSettings";
import { AssetConfig, AssetCopy as Copy } from "../../constants/assets";
import { AssetStyles as styles } from "../../constants/assetStyles";
import { AppColors } from "../../constants/colors";
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
  const active = portfolio.assets
    .filter((asset) => !asset.deleted_on)
    .sort(
      (left, right) =>
        Number(right.is_shared) - Number(left.is_shared) ||
        left.name.localeCompare(right.name, AssetConfig.locale),
    );
  return (
    <View style={styles.section}>
      {active.map((asset) => {
        const value = latestValuation(portfolio.valuations, asset.id);
        const activity = assetActivity(portfolio, asset.id);
        return (
          <Pressable
            key={asset.id}
            accessibilityRole="button"
            accessibilityLabel={`${asset.name}${Copy.separator}${Copy.view}`}
            style={({ pressed }) => [
              styles.card,
              styles.assetCard,
              isAssetDebt(asset.kind) ? styles.debtTint : styles.assetTint,
              pressed && styles.assetCardPressed,
            ]}
            onPress={() => onSelect(asset)}
          >
            <View style={[styles.row, styles.assetHeadingRow]}>
              <Text style={[styles.text, styles.grow]}>{asset.name}</Text>
              <Text style={styles.title}>
                {formatAssetAmount(assetBalance(portfolio, asset.id))}
              </Text>
              <Feather
                name="chevron-right"
                size={AppSettingsUi.selectionChevronIconSize}
                color={AppColors.primary}
              />
            </View>
            <Text style={styles.hint}>
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
            <Text style={styles.hint}>
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
