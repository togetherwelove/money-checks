import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SupportPackageIcon } from "../components/SupportPackageIcon";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  SupportMessages,
  SupportPackageCatalog,
  type SupportPackageIdentifier,
  SupportUi,
} from "../constants/support";
import {
  CompactLabelTextStyle,
  SupportingTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import type { SupportPackageSnapshot } from "../lib/subscription/supportClient";

type SupportScreenProps = {
  isLoading: boolean;
  onPurchasePackage: (identifier: SupportPackageIdentifier) => Promise<void>;
  packages: SupportPackageSnapshot[];
};

export function SupportScreen({ isLoading, onPurchasePackage, packages }: SupportScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.packageList}>
        {SupportPackageCatalog.map((item) => {
          const matchingPackage = packages.find(
            (currentPackage) => currentPackage.identifier === item.identifier,
          );
          const priceLabel = matchingPackage?.priceLabel ?? SupportMessages.pricePendingLabel;
          const isDisabled = isLoading || !matchingPackage;

          return (
            <Pressable
              key={item.identifier}
              disabled={isDisabled}
              onPress={() => onPurchasePackage(item.identifier)}
              style={({ pressed }) => [
                styles.packageCard,
                pressed && !isDisabled ? styles.pressedCard : null,
                isDisabled ? styles.disabledCard : null,
              ]}
            >
              <SupportPackageIcon identifier={item.identifier} />
              <View style={styles.packageContent}>
                <Text numberOfLines={1} style={styles.packageTitle}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={styles.supportLabel}>
                  {item.description}
                </Text>
              </View>
              <View style={styles.trailingBlock}>
                <View style={styles.actionHintRow}>
                  <Text numberOfLines={1} style={styles.priceLabel}>
                    {priceLabel}
                  </Text>
                  <Feather
                    color={AppColors.mutedStrongText}
                    name="chevron-right"
                    size={SupportUi.actionIconSize}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      {packages.length === 0 && !isLoading ? (
        <Text style={styles.unavailableDescription}>{SupportMessages.unavailableDescription}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: AppLayout.screenPadding,
    gap: SupportUi.contentGap,
  },
  packageList: {
    gap: SupportUi.listGap,
  },
  packageCard: {
    ...SurfaceCardStyle,
    flexDirection: "row",
    alignItems: "center",
    gap: SupportUi.rowGap,
  },
  disabledCard: {
    opacity: 0.45,
  },
  pressedCard: {
    backgroundColor: AppColors.surfaceMuted,
  },
  packageContent: {
    flex: 1,
    gap: AppLayout.compactGap,
    minWidth: 0,
  },
  packageTitle: {
    color: AppColors.text,
    fontSize: SupportUi.titleFontSize,
    fontWeight: "800",
  },
  supportLabel: {
    ...CompactLabelTextStyle,
    color: AppColors.mutedStrongText,
    fontSize: SupportUi.subtitleFontSize,
    fontWeight: "700",
  },
  trailingBlock: {
    alignItems: "center",
    gap: AppLayout.compactGap,
    flexShrink: 0,
  },
  actionHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppLayout.compactGap,
  },
  priceLabel: {
    color: AppColors.text,
    fontSize: SupportUi.priceLabelFontSize,
    fontWeight: "800",
  },
  unavailableDescription: {
    ...SupportingTextStyle,
    color: AppColors.mutedStrongText,
    textAlign: "center",
  },
});
