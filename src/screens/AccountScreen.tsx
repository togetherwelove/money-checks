import { AppFontSize, AppLineHeight } from "../constants/typography";
import { Feather } from "../components/AppIcons";
import { TextLinkButton } from "../components/TextLinkButton";
import { IconActionButton } from "../components/IconActionButton";
import { AccountDeletionMessages } from "../constants/accountDeletion";
import { SettingsGroup } from "../components/appSettings/SettingsGroup";
import { SettingsRow } from "../components/appSettings/SettingsRow";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../constants/settingsGroupStyles";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { type ReactNode, useEffect, useState } from "react";
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScrollBehavior } from "../constants/scroll";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { AdTrackingPermissionCard } from "../components/accountScreen/AdTrackingPermissionCard";
import { DeleteAccountModal } from "../components/accountScreen/DeleteAccountModal";
import { showDeleteSubscriptionWarning } from "../components/accountScreen/showDeleteSubscriptionWarning";
import { getAppColors } from "../constants/colors";
import { KeyboardLayout } from "../constants/keyboard";
import { AppMessages } from "../constants/messages";
import {
  SubscriptionMessages,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../constants/subscription";
import { getBrandPlusTextStyle } from "../constants/uiStyles";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import type { AdTrackingPermissionState } from "../lib/ads/trackingTransparency";
import { isApplePrivateRelayEmail } from "../lib/auth/applePrivateRelayEmail";
import { signOutFromApp } from "../lib/auth/signOut";
import { showNativeToast } from "../lib/nativeToast";
import { fetchOwnProfileDisplayName, updateOwnProfileDisplayName } from "../lib/profiles";
import { isValidDisplayName, normalizeDisplayNameCandidate } from "../utils/displayName";

type AccountScreenProps = {
  accountProviderLabel: string;
  adTrackingPermissionState: AdTrackingPermissionState;
  email: string;
  fallbackDisplayName: string;
  onOpenAdTrackingSettings: () => void;
  onOpenSubscriptionManagement: () => Promise<void>;
  onRequestAdTrackingPermission: () => void;
  onRestorePurchases: () => Promise<void>;
  screenTitle: ReactNode;
  showAdTrackingPermissionCard: boolean;
  subscriptionTier: SubscriptionTier;
  trackBlockingTask: BusyTaskTracker;
  userId: string;
};

export function AccountScreen({
  accountProviderLabel,
  adTrackingPermissionState,
  email,
  fallbackDisplayName,
  onOpenAdTrackingSettings,
  onOpenSubscriptionManagement,
  onRequestAdTrackingPermission,
  onRestorePurchases,
  screenTitle,
  showAdTrackingPermissionCard,
  subscriptionTier,
  trackBlockingTask,
  userId,
}: AccountScreenProps) {
  const styles = getStyles();
  useAppTheme();
  const [displayName, setDisplayName] = useState(fallbackDisplayName);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const nextDisplayName = await fetchOwnProfileDisplayName(userId);
        const normalizedDisplayName = normalizeDisplayNameCandidate(nextDisplayName);
        if (isMounted && normalizedDisplayName) {
          setDisplayName(normalizedDisplayName);
        }
      } catch {
        if (isMounted) {
          setDisplayName(fallbackDisplayName);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [fallbackDisplayName, userId]);

  const handleSaveDisplayName = async () => {
    if (isSavingDisplayName) {
      return;
    }

    if (!isValidDisplayName(displayName)) {
      showNativeToast(AppMessages.accountNicknameRequiredError);
      return;
    }

    setIsSavingDisplayName(true);

    try {
      const savedDisplayName = await trackBlockingTask(() =>
        updateOwnProfileDisplayName(userId, displayName),
      );
      setDisplayName(savedDisplayName || fallbackDisplayName);
      showNativeToast(AppMessages.accountNicknameSuccess);
      Keyboard.dismiss();
    } catch {
      showNativeToast(AppMessages.accountNicknameError);
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  const handlePressSaveDisplayName = () => {
    void handleSaveDisplayName();
  };

  const handleConfirmSignOut = () => {
    Alert.alert(AppMessages.authSignOutConfirmTitle, AppMessages.authSignOutConfirmMessage, [
      {
        style: "cancel",
        text: "취소",
      },
      {
        onPress: () => {
          void signOutFromApp();
        },
        style: "destructive",
        text: AppMessages.authSignOut,
      },
    ]);
  };

  const handleRestorePurchases = () => {
    void onRestorePurchases();
  };

  const handleOpenSubscriptionManagement = () => {
    void onOpenSubscriptionManagement();
  };

  const handleOpenDeleteFlow = () => {
    if (subscriptionTier === SubscriptionTiers.plus) {
      showDeleteSubscriptionWarning(handleOpenSubscriptionManagement, () =>
        setIsDeleteModalOpen(true),
      );
      return;
    }

    setIsDeleteModalOpen(true);
  };

  return (
    <>
      <ScrollView
        {...AppScrollBehavior}
        contentContainerStyle={styles.content}
        keyboardDismissMode={KeyboardLayout.dismissMode}
        keyboardShouldPersistTaps={KeyboardLayout.persistTaps}
        style={styles.screen}
      >
        {screenTitle}
        <View style={styles.sections}>
          <SettingsGroup>
            <AccountEmailRow email={email} />
            <InfoRow label={AppMessages.accountProvider} value={accountProviderLabel} />
            <InfoRow
              action={
                <IconActionButton
                  accessibilityLabel={SubscriptionMessages.restoreAction}
                  icon="refresh-cw"
                  onPress={handleRestorePurchases}
                  size="compact"
                />
              }
              label={SubscriptionMessages.statusLabel}
              value={
                subscriptionTier === SubscriptionTiers.plus ? (
                  <Text style={styles.value}>
                    <Text style={styles.plusLabelText}>plus</Text> 활성화
                  </Text>
                ) : (
                  SubscriptionMessages.freePlanLabel
                )
              }
            />
            {subscriptionTier === SubscriptionTiers.plus ? (
              <SettingsRow
                label={SubscriptionMessages.manageAction}
                onPress={handleOpenSubscriptionManagement}
              />
            ) : null}
          </SettingsGroup>
          <SettingsGroup title={AppMessages.accountNicknameTitle}>
            <View style={getSettingsGroupStyles().singleLineField}>
              <View>
                <TextInput
                  autoCapitalize="words"
                  autoComplete="nickname"
                  autoCorrect={false}
                  editable={!isSavingDisplayName}
                  importantForAutofill="no"
                  onChangeText={(value) => {
                    setDisplayName(value);
                  }}
                  onSubmitEditing={handlePressSaveDisplayName}
                  placeholder={fallbackDisplayName || AppMessages.accountNicknamePlaceholder}
                  placeholderTextColor={getAppColors().mutedText}
                  returnKeyType="done"
                  style={getSettingsGroupStyles().singleLineInput}
                  submitBehavior="blurAndSubmit"
                  textContentType="none"
                  value={displayName}
                />
                <View
                  pointerEvents="none"
                  accessible={false}
                  style={getSettingsGroupStyles().inputUnderline}
                />
              </View>
            </View>
          </SettingsGroup>
          {showAdTrackingPermissionCard ? (
            <AdTrackingPermissionCard
              onOpenSettings={onOpenAdTrackingSettings}
              onRequestPermission={onRequestAdTrackingPermission}
              permissionState={adTrackingPermissionState}
            />
          ) : null}
          <View style={styles.accountActions}>
            <SettingsGroup>
              <SettingsRow
                label={AppMessages.authSignOut}
                leading={
                  <Feather
                    name="log-out"
                    size={SettingsGroupDesign.iconSize}
                    color={getAppColors().text}
                  />
                }
                onPress={handleConfirmSignOut}
              />
            </SettingsGroup>
            <View style={styles.deleteAction}>
              <TextLinkButton
                label={AccountDeletionMessages.deleteAction}
                onPress={handleOpenDeleteFlow}
                tone="destructive"
              />
            </View>
          </View>
          <AppFooterContentInset />
        </View>
      </ScrollView>
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
    </>
  );
}

function AccountEmailRow({ email }: { email: string }) {
  const styles = getStyles();
  useAppTheme();
  const isPrivateRelayEmail = isApplePrivateRelayEmail(email);

  return (
    <View style={getSettingsGroupStyles().row}>
      <Text style={getSettingsGroupStyles().label}>{AppMessages.accountEmail}</Text>
      <View style={styles.emailValueRow}>
        <Text
          selectable
          numberOfLines={1}
          ellipsizeMode="middle"
          accessibilityLabel={email}
          style={styles.email}
        >
          {email}
        </Text>
        {isPrivateRelayEmail ? (
          <View style={styles.privateRelayBadge}>
            <Text style={styles.privateRelayBadgeText}>
              {AppMessages.accountEmailApplePrivateRelayLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  const styles = getStyles();
  useAppTheme();
  return (
    <SettingsRow
      label={label}
      labelAccessory={action}
      trailing={
        <View style={styles.valueRow}>
          {typeof value === "string" ? <Text style={styles.value}>{value}</Text> : value}
        </View>
      }
    />
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
    accountActions: { gap: SettingsGroupDesign.titleGap },
    deleteAction: {
      alignSelf: "flex-end",
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
    },
    emailValueRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: SettingsGroupDesign.textGap,
    },
    email: {
      ...getSettingsGroupStyles().value,
      fontSize: SettingsGroupDesign.compactValueFontSize,
      minWidth: 0,
      flexShrink: 1,
    },
    value: getSettingsGroupStyles().value,
    plusLabelText: {
      ...getBrandPlusTextStyle(),
    },
    privateRelayBadge: {
      backgroundColor: getAppColors().surfaceStrong,
      borderColor: getAppColors().border,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    privateRelayBadgeText: {
      color: getAppColors().primary,
      fontSize: AppFontSize.caption,
      fontWeight: "800",
      lineHeight: AppLineHeight.caption,
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: 8,
    },
  }),
);
