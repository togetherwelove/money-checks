import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { AppColors, AppGradientColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { SubscriptionMessages } from "../constants/subscription";
import { SubscriptionBenefitMessages } from "../constants/subscriptionBenefits";
import { SubscriptionDetailCopy } from "../constants/subscriptionDetails";
import { SubscriptionPlusLabels } from "../constants/subscriptionPlusLabels";
import { AppTextBreakProps, OneLineTextFitProps } from "../constants/textLayout";
import { BrandPlusTextStyle, CompactLabelTextStyle, SurfaceCardStyle } from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";

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
  const [isPurchaseInfoExpanded, setIsPurchaseInfoExpanded] = useState(false);
  const resolvedPlusPriceLabel = plusPriceLabel ?? SubscriptionMessages.heroPriceLabel;
  const handleOpenLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast(SubscriptionDetailCopy.legalLinkError);
    }
  };

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
            <Text {...AppTextBreakProps} style={styles.description}>
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
                  <Text {...OneLineTextFitProps} style={styles.purchaseButtonText}>
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
            <Text style={styles.priceDetailLabel}>{resolvedPlusPriceLabel}</Text>
          </View>
          <View style={styles.detailSection}>
            <Pressable
              onPress={() => setIsPurchaseInfoExpanded((currentValue) => !currentValue)}
              style={styles.detailToggle}
            >
              <Text style={styles.detailToggleLabel}>
                {isPurchaseInfoExpanded
                  ? SubscriptionDetailCopy.collapseAction
                  : SubscriptionDetailCopy.expandAction}
              </Text>
              <Feather
                color={AppColors.mutedStrongText}
                name={isPurchaseInfoExpanded ? "chevron-up" : "chevron-down"}
                size={16}
              />
            </Pressable>
            {isPurchaseInfoExpanded ? (
              <View style={styles.purchaseInfoCard}>
                <View style={[styles.purchaseInfoRow, styles.purchaseInfoFirstRow]}>
                  <Text style={styles.purchaseInfoLabel}>
                    {SubscriptionMessages.purchaseInfoNameLabel}
                  </Text>
                  <Text style={styles.purchaseInfoValue}>{SubscriptionMessages.screenTitle}</Text>
                </View>
                <View style={styles.purchaseInfoRow}>
                  <Text style={styles.purchaseInfoLabel}>
                    {SubscriptionMessages.purchaseInfoPeriodLabel}
                  </Text>
                  <Text style={styles.purchaseInfoValue}>
                    {SubscriptionMessages.purchaseInfoDefaultPeriodValue}
                  </Text>
                </View>
                <View style={[styles.purchaseInfoRow, styles.purchaseInfoLastRow]}>
                  <Text style={styles.purchaseInfoLabel}>
                    {SubscriptionMessages.purchaseInfoPriceLabel}
                  </Text>
                  <Text style={styles.purchaseInfoValue}>{resolvedPlusPriceLabel}</Text>
                </View>
                <View style={styles.legalLinkRow}>
                  <TextLinkButton
                    label={SubscriptionDetailCopy.privacyPolicyAction}
                    onPress={() => {
                      void handleOpenLegalLink(LegalLinks.privacyPolicyUrl);
                    }}
                  />
                  <TextLinkButton
                    label={SubscriptionDetailCopy.termsOfUseAction}
                    onPress={() => {
                      void handleOpenLegalLink(LegalLinks.termsOfUseUrl);
                    }}
                  />
                </View>
              </View>
            ) : null}
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
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
  salesContent: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 44,
  },
  copySection: {
    width: "100%",
    alignItems: "center",
  },
  benefitSection: {
    width: "100%",
  },
  detailSection: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  detailToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  detailToggleLabel: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  purchaseInfoCard: {
    ...SurfaceCardStyle,
    width: "100%",
  },
  purchaseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingVertical: 12,
    borderBottomColor: AppColors.border,
  },
  purchaseInfoLastRow: {
    borderBottomWidth: 0,
  },
  purchaseInfoFirstRow: {
    paddingTop: 0,
  },
  legalLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  purchaseInfoLabel: CompactLabelTextStyle,
  purchaseInfoValue: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
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
    opacity: 0.45,
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
