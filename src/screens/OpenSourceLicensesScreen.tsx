import { ScrollView, StyleSheet, Text } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { OpenSourceLicensesText } from "../generated/openSourceLicenses";

export function OpenSourceLicensesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text selectable style={styles.licenseText}>
        {OpenSourceLicensesText}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
  },
  licenseText: {
    color: AppColors.text,
    fontSize: 12,
    lineHeight: 18,
  },
});
