import { useAppTheme } from "../../hooks/useAppTheme";
import { Pressable, Text, View } from "react-native";
import { Feather } from "../AppIcons";
import { AssetConfig, AssetCopy as Copy } from "../../constants/assets";
import { getAppColors } from "../../constants/colors";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import type { AssetPortfolio, PersonalAsset } from "../../types/asset";
import { assetKind, isAssetDebt, assetBalance, formatAssetAmount } from "../../utils/assets";

export function AssetList({
  portfolio,
  onSelect,
}: {
  portfolio: AssetPortfolio;
  onSelect: (asset: PersonalAsset) => void;
}) {
  useAppTheme();
  const styles = getSettingsGroupStyles();
  const active = portfolio.assets
    .filter((asset) => !asset.deleted_on)
    .sort(
      (left, right) =>
        Number(right.is_shared) - Number(left.is_shared) ||
        left.name.localeCompare(right.name, AssetConfig.locale),
    );
  return (
    <View style={styles.card}>
      {active.map((asset, index) => (
        <View key={asset.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${asset.name}${Copy.separator}${Copy.view}`}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => onSelect(asset)}
          >
            <View style={styles.content}>
              <Text style={styles.label}>{asset.name}</Text>
              <Text style={styles.count}>
                {assetKind(asset.kind).label}
                {Copy.separator}
                {asset.is_shared ? Copy.shared : Copy.private}
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                styles.accessoryLabel,
                isAssetDebt(asset.kind) && styles.destructive,
              ]}
            >
              {formatAssetAmount(assetBalance(portfolio, asset.id))}
            </Text>
            <Feather
              name="chevron-right"
              size={SettingsGroupDesign.iconSize}
              color={getAppColors().mutedStrongText}
            />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
