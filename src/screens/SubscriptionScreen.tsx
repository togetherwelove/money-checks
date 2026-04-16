import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  SubscriptionMessages,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../constants/subscription";
import { CardTitleTextStyle, CompactLabelTextStyle, SurfaceCardStyle } from "../constants/uiStyles";

type SubscriptionScreenProps = {
  hasAvailablePlusPackage: boolean;
  isPlusActive: boolean;
  onPurchasePlus: () => Promise<void>;
  onRestorePurchases: () => Promise<void>;
  subscriptionTier: SubscriptionTier;
};

export function SubscriptionScreen({
  hasAvailablePlusPackage,
  isPlusActive,
  onPurchasePlus,
  onRestorePurchases,
  subscriptionTier,
}: SubscriptionScreenProps) {
  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={[styles.card, styles.heroCard]}>
        <Text style={styles.heroBadge}>{SubscriptionMessages.heroBadge}</Text>
        <Text style={styles.heroTitle}>{SubscriptionMessages.heroTitle}</Text>
        <InfoRow
          label={SubscriptionMessages.statusLabel}
          value={
            subscriptionTier === SubscriptionTiers.plus
              ? SubscriptionMessages.plusPlanLabel
              : SubscriptionMessages.freePlanLabel
          }
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{SubscriptionMessages.comparisonTitle}</Text>
        <View style={styles.planCardGroup}>
          <PlanCard
            headline={SubscriptionMessages.comparisonFreeHeadline}
            isHighlighted={false}
            planLabel={SubscriptionMessages.comparisonFreeLabel}
            summary={SubscriptionMessages.freeSummary}
          />
          <PlanCard
            headline={SubscriptionMessages.comparisonPlusHeadline}
            isHighlighted
            planLabel={SubscriptionMessages.comparisonPlusLabel}
            summary={SubscriptionMessages.plusSummary}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{SubscriptionMessages.actionsTitle}</Text>
        <Text style={styles.summaryText}>
          {isPlusActive ? SubscriptionMessages.plusSummary : SubscriptionMessages.freeSummary}
        </Text>
        {!isPlusActive && hasAvailablePlusPackage ? (
          <View style={styles.actionRow}>
            <ActionButton
              label={SubscriptionMessages.purchaseAction}
              onPress={() => {
                void onPurchasePlus();
              }}
              size="inline"
              variant="primary"
            />
          </View>
        ) : null}
        <View style={styles.actionRow}>
          <ActionButton
            label={SubscriptionMessages.restoreAction}
            onPress={() => {
              void onRestorePurchases();
            }}
            size="inline"
            variant="secondary"
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function PlanCard({
  headline,
  isHighlighted,
  planLabel,
  summary,
}: {
  headline: string;
  isHighlighted: boolean;
  planLabel: string;
  summary: string;
}) {
  return (
    <View style={[styles.planCard, isHighlighted ? styles.planCardHighlighted : null]}>
      <Text style={[styles.planCardLabel, isHighlighted ? styles.planCardLabelHighlighted : null]}>
        {planLabel}
      </Text>
      <Text style={styles.planCardHeadline}>{headline}</Text>
      <Text style={styles.planCardSummary}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: 24,
  },
  card: {
    ...SurfaceCardStyle,
    gap: 12,
  },
  heroCard: {
    backgroundColor: AppColors.primary,
  },
  cardTitle: CardTitleTextStyle,
  heroBadge: {
    alignSelf: "flex-start",
    color: AppColors.primary,
    backgroundColor: AppColors.surface,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    color: AppColors.inverseText,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  infoRow: {
    gap: 4,
    paddingTop: 4,
  },
  label: {
    ...CompactLabelTextStyle,
    color: AppColors.inverseText,
  },
  value: {
    color: AppColors.inverseText,
    fontSize: 14,
    fontWeight: "700",
  },
  planCardGroup: {
    gap: 10,
  },
  planCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: AppColors.surfaceMuted,
  },
  planCardHighlighted: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  planCardLabel: {
    color: AppColors.mutedText,
    fontSize: 16,
    fontWeight: "700",
  },
  planCardLabelHighlighted: {
    color: AppColors.primary,
  },
  planCardHeadline: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  planCardSummary: {
    color: AppColors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  summaryText: {
    color: AppColors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    paddingTop: 2,
  },
});
