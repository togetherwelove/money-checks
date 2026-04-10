import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { AnnualReportCopy, AnnualReportUi } from "../constants/annualReport";
import { AppColors } from "../constants/colors";
import { ICON_ACTION_BUTTON_COMPACT_SIZE } from "./IconActionButton";

type LedgerBookHeaderActionProps = {
  label: string;
  onPress: () => void;
};

export function LedgerBookHeaderAction({ label, onPress }: LedgerBookHeaderActionProps) {
  return (
    <Pressable
      accessibilityLabel={AnnualReportCopy.headerAccessibilityLabel}
      onPress={onPress}
      style={styles.button}
    >
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Feather color={AppColors.mutedText} name="download" size={AnnualReportUi.headerIconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 6,
    minHeight: ICON_ACTION_BUTTON_COMPACT_SIZE,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
