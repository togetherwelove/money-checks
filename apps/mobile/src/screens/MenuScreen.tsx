import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";

type MenuScreenProps = {
  onOpenAccount: () => void;
  onOpenNotificationSettings: () => void;
  onOpenShare: () => void;
  showNotificationSettings: boolean;
};

export function MenuScreen({
  onOpenAccount,
  onOpenNotificationSettings,
  onOpenShare,
  showNotificationSettings,
}: MenuScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>{AppMessages.menuTitle}</Text>
      <MenuItem icon="users" label={AppMessages.menuShareTitle} onPress={onOpenShare} />
      <MenuItem icon="user" label={AppMessages.menuAccountTitle} onPress={onOpenAccount} />
      {showNotificationSettings ? (
        <MenuItem
          icon="bell"
          label={NotificationUiCopy.menuTitle}
          onPress={onOpenNotificationSettings}
        />
      ) : null}
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Feather color={AppColors.primary} name={icon} size={18} />
      <View style={styles.itemText}>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: 24,
  },
  title: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: "800",
    paddingTop: 8,
  },
  item: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
