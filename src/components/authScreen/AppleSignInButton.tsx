import { AntDesign } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppleAuthCopy } from "../../constants/appleAuth";
import { AppColors } from "../../constants/colors";

type AppleSignInButtonProps = {
  onPress: () => void | Promise<void>;
};

export function AppleSignInButton({ onPress }: AppleSignInButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <View style={styles.iconBox}>
        <AntDesign color={AppColors.surface} name="apple" size={18} />
      </View>
      <Text style={styles.label}>{AppleAuthCopy.signInAction}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: AppColors.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 20,
    alignItems: "center",
  },
  label: {
    color: AppColors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});
