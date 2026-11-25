import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useAppTheme } from "../hooks/useAppTheme";
import { useLayoutEffect, useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";
import { AssetCopy as Copy } from "../constants/assets";
import { getAssetStyles } from "../constants/assetStyles";
import { getAppColors } from "../constants/colors";
import { getSwitchAppearance } from "../constants/switchAppearance";
import { MemberAssetList } from "../components/assets/MemberAssetList";
import { usePersonalAssets } from "../hooks/usePersonalAssets";
import { createNativeHeaderTextButton } from "../lib/nativeHeaderTextButton";
import type { PersonalAsset } from "../types/asset";
import { assetBalance, formatAssetAmount, portfolioSummary } from "../utils/assets";
import { AssetEditorSheet } from "../components/assets/AssetEditorSheet";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";

export function AssetsScreen({
  userId,
  bookId,
  setHeaderOptions,
}: {
  userId: string;
  bookId: string | null;
  setHeaderOptions: (options: NativeStackNavigationOptions) => void;
}) {
  useAppTheme();
  const { portfolio, members, loading, error, refresh } = usePersonalAssets(bookId ?? "");
  const [editing, setEditing] = useState<{ asset: PersonalAsset | null } | null>(null);
  const [showMine, setShowMine] = useState(false);
  const addDisabled = loading || Boolean(error) || !bookId;
  const primaryColor = getAppColors().primary;
  useLayoutEffect(() => {
    const addButton = createNativeHeaderTextButton({
      label: Copy.add,
      tintColor: primaryColor,
      disabled: addDisabled,
      onPress: () => setEditing({ asset: null }),
    });
    setHeaderOptions({
      unstable_headerRightItems: () => [addButton],
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: addDisabled }}
          disabled={addDisabled}
          onPress={addButton.onPress}
          style={addDisabled ? getAssetStyles().disabled : undefined}
        >
          <Text style={getAssetStyles().action}>{Copy.add}</Text>
        </Pressable>
      ),
    });
  }, [addDisabled, primaryColor, setHeaderOptions]);
  const hasOtherMembers = members.some((member) => member.userId !== userId);
  const ownAssetsOnly = hasOtherMembers && showMine;
  const visiblePortfolio = ownAssetsOnly
    ? { ...portfolio, assets: portfolio.assets.filter((asset) => asset.user_id === userId) }
    : portfolio;
  const summary = portfolioSummary(visiblePortfolio);
  const hasAssets = visiblePortfolio.assets.some((asset) => !asset.deleted_on);
  return (
    <>
      <KeyboardAwareScrollView
        style={getAssetStyles().screen}
        contentContainerStyle={getAssetStyles().content}
      >
        {loading ? (
          <ActivityIndicator accessibilityLabel={Copy.loading} color={getAppColors().primary} />
        ) : null}
        {error ? (
          <View style={getAssetStyles().section}>
            <Text accessibilityRole="alert" style={getAssetStyles().error}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void refresh();
              }}
              style={getAssetStyles().row}
            >
              <Text style={getAssetStyles().action}>{Copy.retry}</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && !error ? (
          <>
            <View style={[getAssetStyles().card, getAssetStyles().summaryCard]}>
              <View style={[getAssetStyles().row, getAssetStyles().assetHeadingRow]}>
                <Text style={[getAssetStyles().amount, getAssetStyles().grow]}>
                  {formatAssetAmount(summary.net)}
                </Text>
                {hasOtherMembers ? (
                  <View style={getAssetStyles().scopeControl}>
                    <Text style={getAssetStyles().label}>{Copy.showMine}</Text>
                    <Switch
                      accessibilityLabel={Copy.showMine}
                      {...getSwitchAppearance()}
                      value={ownAssetsOnly}
                      onValueChange={setShowMine}
                    />
                  </View>
                ) : null}
              </View>
              <View style={getAssetStyles().summaryBreakdown}>
                <View style={getAssetStyles().summaryMetric}>
                  <Text style={getAssetStyles().hint}>{Copy.total}</Text>
                  <Text style={getAssetStyles().title}>{formatAssetAmount(summary.total)}</Text>
                </View>
                <View style={getAssetStyles().summaryMetric}>
                  <Text style={getAssetStyles().hint}>{Copy.debt}</Text>
                  <Text style={getAssetStyles().debtHeading}>
                    {formatAssetAmount(summary.debt)}
                  </Text>
                </View>
              </View>
            </View>
            {!hasAssets ? <Text style={getAssetStyles().hint}>{Copy.empty}</Text> : null}
            {hasAssets ? (
              <MemberAssetList
                portfolio={visiblePortfolio}
                members={members}
                userId={userId}
                onSelect={(asset) => setEditing({ asset })}
              />
            ) : null}
          </>
        ) : null}
        <AppFooterContentInset />
      </KeyboardAwareScrollView>
      {editing ? (
        <AssetEditorSheet
          userId={userId}
          bookId={bookId ?? ""}
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
