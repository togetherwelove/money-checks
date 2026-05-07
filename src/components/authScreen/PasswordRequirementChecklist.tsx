import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { PasswordValidationCopy, PasswordValidationUi } from "../../constants/passwordValidation";
import {
  getPasswordRequirementStates,
  isPasswordConfirmationValid,
} from "../../lib/auth/passwordValidation";

type PasswordRequirementChecklistProps = {
  password: string;
};

type PasswordConfirmationRequirementProps = {
  confirmPassword: string;
  password: string;
};

export function PasswordRequirementChecklist({ password }: PasswordRequirementChecklistProps) {
  const requirements = getPasswordRequirementStates(password);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{PasswordValidationCopy.title}</Text>
      <View style={styles.list}>
        {requirements.map((requirement) => (
          <PasswordRequirementItem
            isMet={requirement.isMet}
            key={requirement.key}
            label={requirement.label}
          />
        ))}
      </View>
    </View>
  );
}

export function PasswordConfirmationRequirement({
  confirmPassword,
  password,
}: PasswordConfirmationRequirementProps) {
  if (!confirmPassword) {
    return null;
  }

  return (
    <PasswordRequirementItem
      isMet={isPasswordConfirmationValid(password, confirmPassword)}
      label={PasswordValidationCopy.matchesConfirmation}
    />
  );
}

function PasswordRequirementItem({ isMet, label }: { isMet: boolean; label: string }) {
  return (
    <View style={styles.item}>
      <View style={[styles.indicator, isMet ? styles.indicatorMet : styles.indicatorUnmet]} />
      <Text style={[styles.itemText, isMet ? styles.itemTextMet : styles.itemTextUnmet]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: PasswordValidationUi.checklistGap,
  },
  title: {
    color: AppColors.mutedText,
    fontSize: PasswordValidationUi.titleTextSize,
    fontWeight: "700",
    lineHeight: PasswordValidationUi.titleLineHeight,
  },
  list: {
    gap: PasswordValidationUi.checklistGap,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: PasswordValidationUi.itemGap,
  },
  indicator: {
    width: PasswordValidationUi.indicatorSize,
    height: PasswordValidationUi.indicatorSize,
    borderRadius: PasswordValidationUi.indicatorSize,
    borderWidth: PasswordValidationUi.indicatorBorderWidth,
  },
  indicatorMet: {
    backgroundColor: AppColors.income,
    borderColor: AppColors.income,
  },
  indicatorUnmet: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
  },
  itemText: {
    fontSize: PasswordValidationUi.itemTextSize,
    fontWeight: "600",
    lineHeight: PasswordValidationUi.itemLineHeight,
  },
  itemTextMet: {
    color: AppColors.income,
  },
  itemTextUnmet: {
    color: AppColors.mutedText,
  },
});
