import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { GoogleAuthCopy } from "../../constants/googleAuth";
import { GoogleGIcon } from "./GoogleGIcon";

type GoogleSignInButtonProps = {
  onPress: () => void | Promise<void>;
};

export function GoogleSignInButton({ onPress }: GoogleSignInButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <View style={styles.iconBox}>
        <GoogleGIcon />
      </View>
      <Text style={styles.label}>{GoogleAuthCopy.signInAction}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
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
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
