import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";

type ScreenHeaderBlockProps = {
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function ScreenHeaderBlock({ eyebrow, subtitle, title }: ScreenHeaderBlockProps) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
    paddingTop: 8,
  },
  eyebrow: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: AppColors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
});
