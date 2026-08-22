import { Feather } from "@expo/vector-icons";
import { type ReactNode, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { SubscriptionMessages } from "../constants/subscription";
import {
  AppTextBreakProps,
  CompactTextProps,
  OneLineTextFitProps,
} from "../constants/textLayout";
import {
  BrandPlusTextStyle,
  CompactLabelTextStyle,
  ListGroupStyle,
  ResponsivePageContentStyle,
} from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";

type SubscriptionScreenProps = {
  hasAvailablePlusPackage: boolean;
  isPlusActive: boolean;
  onPurchasePlus: () => Promise<void>;
  plusPriceLabel: string | null;
  screenTitle: ReactNode;
};

export function SubscriptionScreen({
  hasAvailablePlusPackage,
  isPlusActive,
  onPurchasePlus,
  plusPriceLabel,
  screenTitle,
}: SubscriptionScreenProps) {
  const [isPurchaseInfoExpanded, setIsPurchaseInfoExpanded] = useState(false);
  const resolvedPlusPriceLabel = plusPriceLabel ?? SubscriptionMessages.heroPriceLabel;
  const handleOpenLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast("링크를 열지 못했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.scrollView}>
        {screenTitle}
        <View style={styles.salesContent}>
          <View style={styles.copySection}>
            <Text {...AppTextBreakProps} style={styles.description}>
              {SubscriptionMessages.heroDescription}
            </Text>
          </View>
          <View style={styles.benefitSection}>
            <View style={styles.benefitList}>
              {["· 광고 모두 제거", "· 가계부 동시 최대 3개", "· 가계부당 공유 멤버 최대 5명"].map((item) => (
                <Text key={item} style={styles.benefitItem}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.ctaSection}>
            {isPlusActive ? (
              <View style={styles.activeChip}>
                <Text {...CompactTextProps} style={styles.activeChipText}>
                  {SubscriptionMessages.plusSummary}
                </Text>
              </View>
            ) : hasAvailablePlusPackage ? (
              <ActionButton
                fullWidth
                label={SubscriptionMessages.purchaseAction}
                labelContent={
                  <Text {...OneLineTextFitProps} style={styles.purchaseButtonText}>
                    알뜰 <Text style={styles.purchaseButtonPlusText}>plus</Text> 구독
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
              <Text {...CompactTextProps} style={styles.detailToggleLabel}>
                {isPurchaseInfoExpanded ? "접기" : "자세히보기"}
              </Text>
              <Feather
                color={AppColors.mutedStrongText}
                name={isPurchaseInfoExpanded ? "chevron-up" : "chevron-down"}
                size={16}
              />
            </Pressable>
            {isPurchaseInfoExpanded ? (
              <View style={styles.purchaseInfoCard}>
                <View style={styles.purchaseInfoRow}>
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
                    label="개인정보 처리방침"
                    onPress={() => {
                      void handleOpenLegalLink(LegalLinks.privacyPolicyUrl);
                    }}
                  />
                  <TextLinkButton
                    label="이용약관"
                    onPress={() => {
                      void handleOpenLegalLink(LegalLinks.termsOfUseUrl);
                    }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
        <AppFooterContentInset />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  scrollView: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  content: {
    ...ResponsivePageContentStyle,
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
    ...ListGroupStyle,
    width: "100%",
  },
  purchaseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: AppLayout.compactGap,
    borderBottomWidth: 1,
    paddingHorizontal: AppLayout.cardContentPadding,
    paddingVertical: 12,
    borderBottomColor: AppColors.border,
  },
  purchaseInfoLastRow: {
    borderBottomWidth: 0,
  },
  legalLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    padding: AppLayout.cardContentPadding,
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
