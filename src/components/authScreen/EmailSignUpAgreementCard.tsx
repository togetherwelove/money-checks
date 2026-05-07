import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy, EmailSignUpAgreementUi } from "../../constants/emailAuth";
import { SurfaceCardStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";
import { TextLinkButton } from "../TextLinkButton";

type EmailSignUpAgreementCardProps = {
  hasAgreedToPrivacy: boolean;
  hasAgreedToTerms: boolean;
  onBack: () => void;
  onNext: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTermsOfUse: () => void;
  onToggleAll: () => void;
  onTogglePrivacy: () => void;
  onToggleTerms: () => void;
};

export function EmailSignUpAgreementCard({
  hasAgreedToPrivacy,
  hasAgreedToTerms,
  onBack,
  onNext,
  onOpenPrivacyPolicy,
  onOpenTermsOfUse,
  onToggleAll,
  onTogglePrivacy,
  onToggleTerms,
}: EmailSignUpAgreementCardProps) {
  const hasAgreedToAll = hasAgreedToTerms && hasAgreedToPrivacy;

  return (
    <View style={styles.card}>
      <AgreementRow
        checked={hasAgreedToAll}
        label={EmailAuthCopy.signUp.agreementAllLabel}
        onPress={onToggleAll}
      />
      <View style={styles.divider} />
      <AgreementRow
        checked={hasAgreedToTerms}
        label={EmailAuthCopy.signUp.agreementTermsLabel}
        onPress={onToggleTerms}
        onPressView={onOpenTermsOfUse}
        required
      />
      <AgreementRow
        checked={hasAgreedToPrivacy}
        label={EmailAuthCopy.signUp.agreementPrivacyLabel}
        onPress={onTogglePrivacy}
        onPressView={onOpenPrivacyPolicy}
        required
      />
      <View style={styles.actionGroup}>
        <ActionButton
          disabled={!hasAgreedToAll}
          fullWidth
          label={EmailAuthCopy.signUp.agreementNextAction}
          onPress={onNext}
          size="large"
          variant="primary"
        />
        <ActionButton
          fullWidth
          label={EmailAuthCopy.signUp.backAction}
          onPress={onBack}
          size="large"
          variant="secondary"
        />
      </View>
    </View>
  );
}

type AgreementRowProps = {
  checked: boolean;
  label: string;
  onPress: () => void;
  onPressView?: () => void;
  required?: boolean;
};

function AgreementRow({
  checked,
  label,
  onPress,
  onPressView,
  required = false,
}: AgreementRowProps) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress}>
        <View style={[styles.checkbox, checked ? styles.checkedBox : null]}>
          {checked ? (
            <Feather
              color={AppColors.inverseText}
              name="check"
              size={EmailSignUpAgreementUi.checkIconSize}
            />
          ) : null}
        </View>
      </Pressable>
      <Pressable onPress={onPress} style={styles.labelButton}>
        <Text style={styles.label}>
          {required ? (
            <Text style={styles.requiredPrefix}>
              [{EmailAuthCopy.signUp.agreementRequiredPrefix}]{" "}
            </Text>
          ) : null}
          {label}
        </Text>
      </Pressable>
      {onPressView ? (
        <TextLinkButton label={EmailAuthCopy.signUp.agreementViewAction} onPress={onPressView} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...SurfaceCardStyle,
    gap: EmailSignUpAgreementUi.cardGap,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: EmailSignUpAgreementUi.rowGap,
  },
  checkbox: {
    alignItems: "center",
    justifyContent: "center",
    width: EmailSignUpAgreementUi.checkBoxSize,
    height: EmailSignUpAgreementUi.checkBoxSize,
    borderColor: AppColors.border,
    borderRadius: EmailSignUpAgreementUi.checkBoxBorderRadius,
    borderWidth: EmailSignUpAgreementUi.checkBoxBorderWidth,
    backgroundColor: AppColors.surface,
  },
  checkedBox: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  labelButton: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: AppColors.text,
    fontSize: EmailSignUpAgreementUi.labelFontSize,
    fontWeight: "700",
    lineHeight: EmailSignUpAgreementUi.labelLineHeight,
  },
  requiredPrefix: {
    color: AppColors.primary,
  },
  divider: {
    height: EmailSignUpAgreementUi.dividerHeight,
    backgroundColor: AppColors.border,
  },
  actionGroup: {
    gap: EmailSignUpAgreementUi.actionGroupGap,
    paddingTop: EmailSignUpAgreementUi.actionGroupPaddingTop,
  },
});
