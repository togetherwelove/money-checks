import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "../components/AppIcons";
import { getMenuStyles } from "../constants/menuStyles";
import { AppScrollBehavior } from "../constants/scroll";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { SupportPackageIcon } from "../components/SupportPackageIcon";
import { getAppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  SupportMessages,
  getSupportPackageCatalog,
  type SupportPackageIdentifier,
  SupportUi,
} from "../constants/support";
import { OneLineTextFitProps } from "../constants/textLayout";
import { getSupportingTextStyle } from "../constants/uiStyles";
import type { SupportPackageSnapshot } from "../lib/subscription/supportClient";

type SupportScreenProps = {
  isLoading: boolean;
  onPurchasePackage: (identifier: SupportPackageIdentifier) => Promise<void>;
  packages: SupportPackageSnapshot[];
  screenTitle: ReactNode;
};

export function SupportScreen({
  isLoading,
  onPurchasePackage,
  packages,
  screenTitle,
}: SupportScreenProps) {
  const styles = getStyles();
  useAppTheme();
  return (
    <ScrollView {...AppScrollBehavior} contentContainerStyle={styles.content} style={styles.screen}>
      {screenTitle}
      <View style={styles.sections}>
        <View style={styles.packageList}>
          {getSupportPackageCatalog().map((item, index) => {
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
                  index === getSupportPackageCatalog().length - 1 ? styles.lastPackageCard : null,
                  pressed && !isDisabled ? styles.pressedCard : null,
                  isDisabled ? styles.disabledCard : null,
                ]}
              >
                <SupportPackageIcon identifier={item.identifier} />
                <View style={styles.packageContent}>
                  <Text {...OneLineTextFitProps} style={styles.packageTitle}>
                    {item.title}
                  </Text>
                  <Text {...OneLineTextFitProps} style={styles.supportLabel}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.trailingBlock}>
                  <View style={styles.actionHintRow}>
                    <Text {...OneLineTextFitProps} style={styles.priceLabel}>
                      {priceLabel}
                    </Text>
                    <Feather
                      color={getAppColors().mutedStrongText}
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
          <Text style={styles.unavailableDescription}>
            {SupportMessages.unavailableDescription}
          </Text>
        ) : null}
        <AppFooterContentInset />
      </View>
    </ScrollView>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    sections: {
      gap: getMenuStyles().sections.gap,
    },
    screen: {
      flex: 1,
      backgroundColor: getAppColors().screenBackground,
    },
    content: {
      ...getMenuStyles().content,
    },
    packageList: {
      ...getMenuStyles().group,
    },
    packageCard: {
      ...getMenuStyles().row,
      flexDirection: "row",
      alignItems: "center",
      gap: SupportUi.rowGap,
    },
    lastPackageCard: {
      borderBottomWidth: 0,
    },
    disabledCard: {
      opacity: 0.45,
    },
    pressedCard: {
      backgroundColor: getAppColors().surfaceMuted,
    },
    packageContent: getMenuStyles().textBlock,
    packageTitle: getMenuStyles().title,
    supportLabel: getMenuStyles().description,
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
      color: getAppColors().text,
      fontSize: SupportUi.priceLabelFontSize,
      fontWeight: "800",
    },
    unavailableDescription: {
      ...getSupportingTextStyle(),
      color: getAppColors().mutedStrongText,
      textAlign: "center",
    },
  }),
);
