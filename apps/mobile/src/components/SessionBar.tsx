import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import { signOutFromApp } from "../lib/auth/signOut";

type SessionBarProps = {
  email: string;
};

export function SessionBar({ email }: SessionBarProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>{AppMessages.authSignedIn}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
      <Pressable onPress={() => void signOutFromApp()}>
        <Text style={styles.signOut}>{AppMessages.authSignOut}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 11,
  },
  email: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  signOut: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
});
