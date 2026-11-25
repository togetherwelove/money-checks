import { Text, View } from "react-native";
import { SubscriptionPageBenefits } from "../constants/subscriptionPage";
import { getSubscriptionPageStyles } from "../constants/subscriptionPageStyles";
import { SettingsGroupDesign } from "../constants/settingsGroupStyles";
import { getAppColors } from "../constants/colors";
import { AppTextBreakProps } from "../constants/textLayout";
import { useAppTheme } from "../hooks/useAppTheme";
import { Feather } from "./AppIcons";

export function SubscriptionBenefits() {
  useAppTheme();
  const styles = getSubscriptionPageStyles();
  return (
    <View style={styles.benefits}>
      {SubscriptionPageBenefits.map((benefit, index) => (
        <View key={benefit.icon} style={[styles.benefit, index > 0 && styles.benefitDivider]}>
          <Feather
            name={benefit.icon}
            size={SettingsGroupDesign.iconSize}
            color={getAppColors().mutedStrongText}
          />
          <View style={styles.benefitContent}>
            <Text {...AppTextBreakProps} style={styles.benefitTitle}>
              {benefit.title}
            </Text>
            <Text {...AppTextBreakProps} style={styles.description}>
              {benefit.description}
            </Text>
          </View>
          <Text style={styles.benefitValue}>{benefit.value}</Text>
        </View>
      ))}
    </View>
  );
}
