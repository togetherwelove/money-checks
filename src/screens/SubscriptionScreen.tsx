import { Linking, Text, View } from "react-native";
import { ActionButton } from "../components/ActionButton";
import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { SubscriptionBenefits } from "../components/SubscriptionBenefits";
import { TextLinkButton } from "../components/TextLinkButton";
import { LegalLinks } from "../constants/legal";
import { SubscriptionMessages } from "../constants/subscription";
import { SubscriptionPageCopy } from "../constants/subscriptionPage";
import { getSubscriptionPageStyles } from "../constants/subscriptionPageStyles";
import { AppTextBreakProps } from "../constants/textLayout";
import { useAppTheme } from "../hooks/useAppTheme";
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
  const styles = getSubscriptionPageStyles();
  useAppTheme();
  const handleOpenLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast(SubscriptionPageCopy.linkError);
    }
  };
  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <View style={styles.sections}>
          <View style={styles.intro}>
            <Text {...AppTextBreakProps} style={styles.headline}>
              {SubscriptionPageCopy.headline}
            </Text>
            <Text {...AppTextBreakProps} style={styles.description}>
              {SubscriptionPageCopy.description}
            </Text>
          </View>
          <SubscriptionBenefits />
          <View style={styles.plan}>
            <View style={styles.planHeading}>
              <Text style={styles.planTitle}>{SubscriptionPageCopy.planTitle}</Text>
              <Text style={styles.description}>{SubscriptionPageCopy.billingSummary}</Text>
            </View>
            <Text {...AppTextBreakProps} style={plusPriceLabel ? styles.price : styles.description}>
              {plusPriceLabel ?? SubscriptionMessages.priceUnavailable}
            </Text>
            {isPlusActive ? (
              <Text style={styles.activeState}>{SubscriptionMessages.plusSummary}</Text>
            ) : hasAvailablePlusPackage && plusPriceLabel ? (
              <ActionButton
                fullWidth
                shape="capsule"
                label={SubscriptionMessages.purchaseAction}
                onPress={onPurchasePlus}
                size="large"
                variant="primary"
              />
            ) : (
              <Text {...AppTextBreakProps} style={styles.description}>
                {SubscriptionMessages.purchaseError}
              </Text>
            )}
          </View>
          <View style={styles.details}>
            <Text {...AppTextBreakProps} style={styles.description}>
              {SubscriptionMessages.renewalNotice}
            </Text>
            <View style={styles.legalLinks}>
              <TextLinkButton
                label={SubscriptionMessages.restoreAction}
                onPress={onRestorePurchases}
              />
              <TextLinkButton
                label={SubscriptionPageCopy.privacyAction}
                onPress={() => {
                  void handleOpenLegalLink(LegalLinks.privacyPolicyUrl);
                }}
              />
              <TextLinkButton
                label={SubscriptionPageCopy.termsAction}
                onPress={() => {
                  void handleOpenLegalLink(LegalLinks.termsOfUseUrl);
                }}
              />
            </View>
          </View>
        </View>
        <AppFooterContentInset />
      </KeyboardAwareScrollView>
    </View>
  );
}
