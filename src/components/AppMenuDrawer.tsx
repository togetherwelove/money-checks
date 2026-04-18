import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { SubscriptionPlusLabels } from "../constants/subscriptionPlusLabels";
import { BrandPlusTextStyle } from "../constants/uiStyles";
import type { AppMenuItem } from "../lib/menuItems";

const MENU_DRAWER_ANIMATION_DURATION_MS = 220;
const MENU_DRAWER_WIDTH = 284;

type AppMenuDrawerProps = {
  isOpen: boolean;
  items: AppMenuItem[];
  onClose: () => void;
  onSelectItem: (targetScreen: AppMenuItem["targetScreen"]) => void;
};

export function AppMenuDrawer({ isOpen, items, onClose, onSelectItem }: AppMenuDrawerProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: MENU_DRAWER_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isOpen, progress]);

  const overlayStyle: Animated.WithAnimatedObject<ViewStyle> = {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };
  const drawerStyle: Animated.WithAnimatedObject<ViewStyle> = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [MENU_DRAWER_WIDTH, 0],
        }),
      },
    ],
  };

  return (
    <View pointerEvents={isOpen ? "auto" : "none"} style={styles.root}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <View style={styles.menuTitle}>
          <Text style={styles.menuLabel}>메뉴</Text>
        </View>
        <View style={styles.items}>
          {items.map((item) => (
            <Pressable
              key={item.targetScreen}
              onPress={() => onSelectItem(item.targetScreen)}
              style={styles.item}
            >
              <Feather color={AppColors.primary} name={item.icon} size={18} />
              {item.targetScreen === "subscription" ? (
                <Text style={styles.itemLabel}>
                  {SubscriptionPlusLabels.menuPrefix} <Text style={styles.itemPlusLabel}>plus</Text>
                </Text>
              ) : (
                <Text style={styles.itemLabel}>{item.label}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.overlay,
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: MENU_DRAWER_WIDTH,
    backgroundColor: AppColors.surface,
    paddingHorizontal: AppLayout.screenPadding * 2,
    gap: 20,
    borderLeftWidth: 1,
    borderLeftColor: AppColors.border,
    shadowColor: AppColors.calendarShadow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: -4,
      height: 0,
    },
  },
  menuTitle: {
    alignItems: "stretch",
    justifyContent: "center",
    paddingTop: 20,
  },
  menuLabel: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  items: {
    gap: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  itemLabel: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  itemPlusLabel: {
    ...BrandPlusTextStyle,
  },
});
