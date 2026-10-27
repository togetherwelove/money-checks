import { Linking,StyleSheet,Text,View } from "react-native";
import { MenuStyles } from "../constants/menuStyles";

import { ActionButton } from "../components/ActionButton";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { TextLinkButton } from "../components/TextLinkButton";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { SubscriptionHeroUi,SubscriptionMessages } from "../constants/subscription";
import {
AppTextBreakProps,
CompactTextProps,
OneLineTextFitProps,
} from "../constants/textLayout";
import {
BrandPlusTextStyle
} from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";

type SubscriptionScreenProps = {
  hasAvailablePlusPackage: boolean;
  isPlusActive: boolean;
  onPurchasePlus: () => Promise<void>;
  onRestorePurchases: () => Promise<void>;
  plusPriceLabel: string | null;
};

export function SubscriptionScreen({
  hasAvailablePlusPackage,
  isPlusActive,
  onPurchasePlus,
  onRestorePurchases,
  plusPriceLabel,
}: SubscriptionScreenProps) {
  const resolvedPlusPriceLabel = plusPriceLabel ?? SubscriptionMessages.priceUnavailable;
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
            ) : hasAvailablePlusPackage && plusPriceLabel ? (
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
              <Text style={styles.renewalNotice}>{SubscriptionMessages.renewalNotice}</Text>
              <View style={styles.legalLinkRow}>
                <TextLinkButton
                  label={SubscriptionMessages.restoreAction}
                  onPress={() => { void onRestorePurchases(); }}
                />
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
    ...MenuStyles.content,
    flexGrow: 1,
  },
  salesContent: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: MenuStyles.sections.gap,
  },
  copySection: {
    width: "100%",
    alignItems: "center",
    gap: SubscriptionHeroUi.brandDescriptionGap,
  },
  benefitSection: {
    width: "100%",
    alignItems: "center",
  },
  detailSection: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  renewalNotice: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    lineHeight: 18,
    padding: AppLayout.cardContentPadding,
  },
  purchaseInfoCard: {
    ...MenuStyles.group,
    width: "100%",
  },
  purchaseInfoRow: {
    ...MenuStyles.row,
    flexWrap: "wrap",
  },  purchaseInfoLastRow: {
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
  purchaseInfoLabel: MenuStyles.description,
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
    maxWidth: "100%",
    gap: 8,
  },
  benefitItem: {
    color: AppColors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "left",
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
