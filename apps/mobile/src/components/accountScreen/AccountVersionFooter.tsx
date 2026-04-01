import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { VersionUiCopy } from "../../constants/versionCopy";
import { AppBuildInfo } from "../../generated/buildInfo";

export function AccountVersionFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`${VersionUiCopy.title} ${AppBuildInfo.appVersion}`}</Text>
      <Text style={styles.detail}>{`${VersionUiCopy.buildPrefix} ${AppBuildInfo.buildId}`}</Text>
      <Text
        style={styles.detail}
      >{`${VersionUiCopy.updatedPrefix} ${AppBuildInfo.builtAtLabel}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: AppLayout.cardGap,
    paddingBottom: AppLayout.cardGap,
    gap: 2,
  },
  title: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  detail: {
    color: AppColors.mutedStrongText,
    fontSize: 10,
    fontWeight: "500",
  },
});
