import { SettingsGroup } from "../components/appSettings/SettingsGroup";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../constants/settingsGroupStyles";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
        {getSupportPackageCatalog().map((item) => {
          const matchingPackage = packages.find(
            (currentPackage) => currentPackage.identifier === item.identifier,
          );
          const priceLabel = matchingPackage?.priceLabel ?? SupportMessages.pricePendingLabel;
          const isDisabled = isLoading || !matchingPackage;

          return (
            <SettingsGroup key={item.identifier} description={item.description}>
              <Pressable
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
                  <Text {...OneLineTextFitProps} style={styles.packageTitle}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.trailingBlock}>
                  <View style={styles.actionHintRow}>
                    <Text {...OneLineTextFitProps} style={styles.priceLabel}>
                      {priceLabel}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </SettingsGroup>
          );
        })}
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
      gap: getSettingsGroupStyles().sections.gap,
    },
    screen: {
      flex: 1,
      backgroundColor: getAppColors().screenBackground,
    },
    content: {
      ...getSettingsGroupStyles().page,
    },
    packageCard: {
      ...getSettingsGroupStyles().row,
      paddingVertical: (SettingsGroupDesign.rowMinHeight - SupportUi.iconContainerSize) / 2,
      flexDirection: "row",
      alignItems: "center",
      gap: getSettingsGroupStyles().row.gap,
    },
    disabledCard: {
      opacity: 0.45,
    },
    pressedCard: {
      backgroundColor: getAppColors().surfaceMuted,
    },
    packageContent: getMenuStyles().textBlock,
    packageTitle: getSettingsGroupStyles().label,
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
    priceLabel: getSettingsGroupStyles().value,
    unavailableDescription: {
      ...getSupportingTextStyle(),
      color: getAppColors().mutedStrongText,
      textAlign: "center",
    },
  }),
);
