import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { AppColors, AppGradientColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { SubscriptionMessages } from "../constants/subscription";
import { SubscriptionBenefitMessages } from "../constants/subscriptionBenefits";
import { SubscriptionPlusLabels } from "../constants/subscriptionPlusLabels";
import { BrandPlusTextStyle } from "../constants/uiStyles";

type SubscriptionScreenProps = {
  hasAvailablePlusPackage: boolean;
  isPlusActive: boolean;
  onPurchasePlus: () => Promise<void>;
  plusPriceLabel: string | null;
};

export function SubscriptionScreen({
  hasAvailablePlusPackage,
  isPlusActive,
  onPurchasePlus,
  plusPriceLabel,
}: SubscriptionScreenProps) {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={AppGradientColors.subscriptionPlusBase}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        style={styles.backgroundGradient}
      />
      <LinearGradient
        colors={AppGradientColors.subscriptionPlusWarmOverlay}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.6, 1]}
        start={{ x: 0.5, y: 0 }}
        style={styles.topOverlayGradient}
      />
      <LinearGradient
        colors={AppGradientColors.subscriptionPlusSoftOverlay}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.65, 1]}
        start={{ x: 0.5, y: 0 }}
        style={styles.bottomOverlayGradient}
      />

      <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.scrollView}>
        <View style={styles.salesContent}>
          <View style={styles.copySection}>
            <Text
              lineBreakStrategyIOS="hangul-word"
              style={styles.description}
              textBreakStrategy="highQuality"
            >
              {SubscriptionMessages.heroDescription}
            </Text>
          </View>
          <View style={styles.benefitSection}>
            <View style={styles.benefitList}>
              {SubscriptionBenefitMessages.items.map((item) => (
                <Text key={item} style={styles.benefitItem}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.ctaSection}>
            {isPlusActive ? (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>{SubscriptionMessages.plusSummary}</Text>
              </View>
            ) : hasAvailablePlusPackage ? (
              <ActionButton
                fullWidth
                label={SubscriptionMessages.purchaseAction}
                labelContent={
                  <Text style={styles.purchaseButtonText}>
                    {SubscriptionPlusLabels.purchaseActionPrefix}{" "}
                    <Text style={styles.purchaseButtonPlusText}>plus</Text>{" "}
                    {SubscriptionPlusLabels.purchaseActionSuffix}
                  </Text>
                }
                onPress={() => {
                  void onPurchasePlus();
                }}
                size="large"
                variant="primary"
              />
            ) : (
              <Text style={styles.unavailableSummary}>{SubscriptionMessages.purchaseError}</Text>
            )}
            <Text style={styles.priceDetailLabel}>
              {plusPriceLabel ?? SubscriptionMessages.heroPriceLabel}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlayGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "62%",
  },
  bottomOverlayGradient: {
    position: "absolute",
    top: "18%",
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: 24,
    paddingBottom: 24,
  },
  salesContent: {
    alignItems: "center",
    gap: 44,
  },
  copySection: {
    width: "100%",
    alignItems: "center",
  },
  benefitSection: {
    width: "100%",
  },
  description: {
    color: AppColors.text,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  ctaSection: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  benefitList: {
    width: "100%",
    gap: 8,
  },
  benefitItem: {
    color: AppColors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  activeChip: {
    borderRadius: 999,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    opacity: 0.45
  },
  activeChipText: {
    color: AppColors.inverseText,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  purchaseButtonText: {
    color: AppColors.inverseText,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  purchaseButtonPlusText: {
    ...BrandPlusTextStyle,
    color: AppColors.inverseText,
  },
  unavailableSummary: {
    color: AppColors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  priceDetailLabel: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
