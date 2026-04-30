import { ScrollView, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { OpenSourceLicensesText } from "../generated/openSourceLicenses";

export function OpenSourceLicensesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Markdown style={markdownStyles}>{OpenSourceLicensesText}</Markdown>
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
});

const markdownStyles = StyleSheet.create({
  body: {
    color: AppColors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  heading1: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: AppLayout.cardGap,
  },
  heading2: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: AppLayout.cardGap,
  },
  link: {
    color: AppColors.primary,
  },
  bullet_list: {
    marginVertical: AppLayout.compactGap,
  },
  table: {
    borderColor: AppColors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  th: {
    backgroundColor: AppColors.surfaceMuted,
  },
  tr: {
    borderBottomColor: AppColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
