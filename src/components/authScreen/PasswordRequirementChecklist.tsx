import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
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
      <Text style={styles.title}>비밀번호 조건</Text>
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
      label="비밀번호 확인과 일치"
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
    gap: 6,
  },
  title: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  list: {
    gap: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 10,
    borderWidth: 1,
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
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  itemTextMet: {
    color: AppColors.income,
  },
  itemTextUnmet: {
    color: AppColors.mutedText,
  },
});
