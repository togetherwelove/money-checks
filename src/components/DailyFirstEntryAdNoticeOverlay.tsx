import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { RewardedInterstitialNoticeOverlayUi } from "../constants/ads";
import { AppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { AppTextBreakProps } from "../constants/textLayout";

type DailyFirstEntryAdNoticeOverlayProps = {
  isVisible: boolean;
};

export function DailyFirstEntryAdNoticeOverlay({ isVisible }: DailyFirstEntryAdNoticeOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator color={AppColors.primary} size="small" />
        <View style={styles.copyGroup}>
          <Text {...AppTextBreakProps} style={styles.title}>
            {EntryRegistrationCopy.dailyFirstEntryAdNoticeTitle}
          </Text>
          <Text {...AppTextBreakProps} style={styles.message}>
            {EntryRegistrationCopy.dailyFirstEntryAdNoticeMessage}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: AppLayout.screenPadding,
    backgroundColor: AppColors.overlay,
  },
  card: {
    width: "100%",
    maxWidth: RewardedInterstitialNoticeOverlayUi.cardMaxWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: RewardedInterstitialNoticeOverlayUi.cardGap,
    paddingHorizontal: RewardedInterstitialNoticeOverlayUi.cardPaddingHorizontal,
    paddingVertical: RewardedInterstitialNoticeOverlayUi.cardPaddingVertical,
    borderRadius: RewardedInterstitialNoticeOverlayUi.cardRadius,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  copyGroup: {
    flex: 1,
    gap: RewardedInterstitialNoticeOverlayUi.copyGap,
  },
  title: {
    color: AppColors.text,
    fontSize: RewardedInterstitialNoticeOverlayUi.titleFontSize,
    fontWeight: "800",
    lineHeight: RewardedInterstitialNoticeOverlayUi.titleLineHeight,
  },
  message: {
    color: AppColors.mutedText,
    fontSize: RewardedInterstitialNoticeOverlayUi.messageFontSize,
    fontWeight: "600",
    lineHeight: RewardedInterstitialNoticeOverlayUi.messageLineHeight,
  },
});
