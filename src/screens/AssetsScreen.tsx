import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AssetCopy as Copy } from "../constants/assets";
import { AssetStyles as styles } from "../constants/assetStyles";
import { AppColors } from "../constants/colors";
import { AssetList } from "../components/assets/AssetList";
import { usePersonalAssets } from "../hooks/usePersonalAssets";
import type { PersonalAsset } from "../types/asset";
import { assetBalance, formatAssetAmount, portfolioSummary, portfolioTrend } from "../utils/assets";
import { AssetEditorSheet } from "../components/assets/AssetEditorSheet";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";

export function AssetsScreen({ userId, bookId }: { userId: string; bookId: string | null }) {
  const { portfolio, loading, error, refresh } = usePersonalAssets(bookId ?? "");
  const [editing, setEditing] = useState<{ asset: PersonalAsset | null } | null>(null);
  const summary = portfolioSummary(portfolio);
  const trend = portfolioTrend(portfolio);
  const previous = trend.length > 1 ? trend[trend.length - 2] : null;
  const active = portfolio.assets.filter((asset) => !asset.deleted_on);
  return (
    <>
      <KeyboardAwareScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.hint, styles.grow]}>{Copy.personal}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={Copy.add}
            disabled={loading || Boolean(error)}
            onPress={() => setEditing({ asset: null })}
            style={loading || error ? styles.disabled : undefined}
          >
            <Text style={styles.action}>{Copy.add}</Text>
          </Pressable>
        </View>
        {loading ? (
          <ActivityIndicator accessibilityLabel={Copy.loading} color={AppColors.primary} />
        ) : null}
        {error ? (
          <View style={styles.section}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void refresh();
              }}
              style={styles.row}
            >
              <Text style={styles.action}>{Copy.retry}</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && !error ? (
          <>
            <View style={styles.card}>
              <Text style={styles.title}>{Copy.net}</Text>
              <Text style={styles.amount}>{formatAssetAmount(summary.net)}</Text>
              <Text style={styles.hint}>
                {previous
                  ? `${Copy.change}${Copy.separator}${formatAssetAmount(summary.net - previous.net)}`
                  : Copy.noPrevious}
              </Text>
              <Text style={styles.hint}>{Copy.summaryHint}</Text>
              <View style={styles.row}>
                <Text style={styles.text}>{Copy.total}</Text>
                <Text style={styles.title}>{formatAssetAmount(summary.total)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.text}>{Copy.debt}</Text>
                <Text style={styles.title}>{formatAssetAmount(summary.debt)}</Text>
              </View>
            </View>
            {!active.length ? <Text style={styles.hint}>{Copy.empty}</Text> : null}
            <AssetList portfolio={portfolio} onSelect={(asset) => setEditing({ asset })} />
            {portfolio.valuations.length ? (
              <View style={styles.card}>
                <Text style={styles.title}>{Copy.trend}</Text>
                <Text style={styles.hint}>{Copy.trendHint}</Text>
                {trend.map((point) => (
                  <View key={point.date} style={styles.row}>
                    <View style={styles.section}>
                      <Text style={styles.text}>{point.date.slice(0, 7)}</Text>
                      <Text style={styles.hint}>
                        {Copy.confirmed}
                        {Copy.separator}
                        {point.confirmed}
                        {Copy.countSeparator}
                        {point.count}
                      </Text>
                    </View>
                    <Text style={styles.title}>{formatAssetAmount(point.net)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        <AppFooterContentInset />
      </KeyboardAwareScrollView>
      {editing ? (
        <AssetEditorSheet
          userId={userId}
          bookId={bookId ?? ""}
          movements={(portfolio.movements ?? [])
            .filter((movement) => movement.asset_id === editing.asset?.id)
            .sort(
              (left, right) =>
                right.occurred_on.localeCompare(left.occurred_on) ||
                right.created_at.localeCompare(left.created_at),
            )}
          currentAmount={editing.asset ? assetBalance(portfolio, editing.asset.id) : undefined}
          asset={editing.asset}
          history={portfolio.valuations
            .filter((value) => value.asset_id === editing.asset?.id)
            .sort(
              (left, right) =>
                right.valued_on.localeCompare(left.valued_on) ||
                right.created_at.localeCompare(left.created_at),
            )}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      ) : null}
    </>
  );
}
