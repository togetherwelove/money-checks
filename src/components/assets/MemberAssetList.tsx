import { Text, View } from "react-native";
import { AssetCopy as Copy } from "../../constants/assets";
import { getAssetStyles } from "../../constants/assetStyles";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { AssetPortfolio, PersonalAsset } from "../../types/asset";
import type { LedgerBookMember } from "../../types/ledgerBookMember";
import { AssetList } from "./AssetList";

export function MemberAssetList({
  portfolio,
  members,
  userId,
  onSelect,
}: {
  portfolio: AssetPortfolio;
  members: readonly LedgerBookMember[];
  userId: string;
  onSelect: (asset: PersonalAsset) => void;
}) {
  useAppTheme();
  const ownerIds = Array.from(
    new Set(portfolio.assets.filter((asset) => !asset.deleted_on).map((asset) => asset.user_id)),
  ).sort((left, right) => Number(right === userId) - Number(left === userId));

  return (
    <View style={getAssetStyles().section}>
      {ownerIds.map((ownerId) => {
        const memberPortfolio = {
          ...portfolio,
          assets: portfolio.assets.filter((asset) => asset.user_id === ownerId),
        };
        const name =
          ownerId === userId
            ? Copy.mine
            : (members.find((member) => member.userId === ownerId)?.displayName ?? Copy.member);
        return (
          <View key={ownerId} style={getAssetStyles().memberAssetSection}>
            <Text
              accessibilityRole="header"
              style={[getAssetStyles().title, getAssetStyles().memberAssetTitle]}
            >
              {name}
            </Text>
            <AssetList portfolio={memberPortfolio} onSelect={onSelect} />
          </View>
        );
      })}
    </View>
  );
}
