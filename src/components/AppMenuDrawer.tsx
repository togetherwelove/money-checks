import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { MenuUi } from "../constants/menu";
import { OneLineTextFitProps } from "../constants/textLayout";
import { BrandPlusTextStyle } from "../constants/uiStyles";
import type {
  AppMenuAction,
  AppMenuItem,
  AppMenuNavigationItem,
  AppMenuSection,
} from "../lib/menuItems";

type AppMenuDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onSelectAction: (action: AppMenuAction) => void;
  onSelectItem: (targetScreen: AppMenuNavigationItem["targetScreen"]) => void;
  sections: AppMenuSection[];
};

const OPEN_TRANSLATE_X = 0;

export function AppMenuDrawer({
  isOpen,
  onClose,
  onOpen,
  onSelectAction,
  onSelectItem,
  sections,
}: AppMenuDrawerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = Math.min(
    MenuUi.drawerWidth,
    windowWidth - MenuUi.drawerHorizontalMargin * 2,
  );
  const closedTranslateX = drawerWidth;
  const drawerTranslateX = useSharedValue(
    isOpen ? OPEN_TRANSLATE_X : closedTranslateX,
  );

  useEffect(() => {
    drawerTranslateX.value = withTiming(isOpen ? OPEN_TRANSLATE_X : closedTranslateX, {
      duration: MenuUi.drawerAnimationDurationMs,
    });
  }, [closedTranslateX, drawerTranslateX, isOpen]);

  const openDrawer = () => {
    "worklet";
    drawerTranslateX.value = withTiming(OPEN_TRANSLATE_X, {
      duration: MenuUi.drawerAnimationDurationMs,
    });
    runOnJS(onOpen)();
  };

  const closeDrawer = () => {
    "worklet";
    drawerTranslateX.value = withTiming(closedTranslateX, {
      duration: MenuUi.drawerAnimationDurationMs,
    });
    runOnJS(onClose)();
  };

  const openGesture = Gesture.Pan()
    .activeOffsetX(-MenuUi.drawerSwipeActiveOffsetX)
    .failOffsetY([-MenuUi.drawerSwipeFailOffsetY, MenuUi.drawerSwipeFailOffsetY])
    .onBegin(() => {
      drawerTranslateX.value = closedTranslateX;
    })
    .onUpdate((event) => {
      drawerTranslateX.value = clampDrawerTranslateX(
        closedTranslateX + event.translationX,
        closedTranslateX,
      );
    })
    .onEnd((event) => {
      const shouldOpen =
        event.velocityX <= MenuUi.drawerSwipeCloseVelocityX ||
        drawerTranslateX.value < closedTranslateX * MenuUi.drawerSwipeOpenThresholdRatio;

      if (shouldOpen) {
        openDrawer();
        return;
      }

      closeDrawer();
    });

  const dragDrawerGesture = Gesture.Pan()
    .activeOffsetX(MenuUi.drawerSwipeActiveOffsetX)
    .failOffsetY([-MenuUi.drawerSwipeFailOffsetY, MenuUi.drawerSwipeFailOffsetY])
    .onUpdate((event) => {
      drawerTranslateX.value = clampDrawerTranslateX(event.translationX, closedTranslateX);
    })
    .onEnd((event) => {
      const shouldClose =
        event.velocityX >= MenuUi.drawerSwipeOpenVelocityX ||
        drawerTranslateX.value > closedTranslateX * MenuUi.drawerSwipeOpenThresholdRatio;

      if (shouldClose) {
        closeDrawer();
        return;
      }

      openDrawer();
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      drawerTranslateX.value,
      [OPEN_TRANSLATE_X, closedTranslateX],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslateX.value }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[styles.overlay, overlayStyle]}
      >
        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      {!isOpen ? (
        <GestureDetector gesture={openGesture}>
          <View style={styles.edgeHitArea} />
        </GestureDetector>
      ) : null}
      <GestureDetector gesture={dragDrawerGesture}>
        <Animated.View
          pointerEvents={isOpen ? "auto" : "none"}
          style={[styles.drawer, { width: drawerWidth }, drawerStyle]}
        >
          <ScrollView contentContainerStyle={styles.sections}>
            {sections.map((section, index) => (
              <View key={section.label} style={styles.section}>
                <View style={index === 0 ? styles.firstSectionHeader : null}>
                  <Text {...OneLineTextFitProps} style={styles.sectionLabel}>
                    {section.label}
                  </Text>
                </View>
                <View style={styles.items}>
                  {section.items.map((item, index) => (
                    <Pressable
                      key={resolveMenuItemKey(item)}
                      onPress={() => {
                        if (isNavigationMenuItem(item)) {
                          onSelectItem(item.targetScreen);
                          return;
                        }

                        onSelectAction(item.action);
                      }}
                      style={[
                        styles.item,
                        index === section.items.length - 1 ? styles.lastItem : null,
                      ]}
                    >
                      <Feather color={AppColors.mutedStrongText} name={item.icon} size={18} />
                      {isNavigationMenuItem(item) && item.targetScreen === "subscription" ? (
                        <Text {...OneLineTextFitProps} style={styles.itemLabel}>
                          알뜰 <Text style={styles.itemPlusLabel}>plus</Text>
                        </Text>
                      ) : (
                        <Text {...OneLineTextFitProps} style={styles.itemLabel}>
                          {item.label}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function clampDrawerTranslateX(nextTranslateX: number, closedTranslateX: number): number {
  "worklet";
  return Math.max(OPEN_TRANSLATE_X, Math.min(closedTranslateX, nextTranslateX));
}

function isNavigationMenuItem(
  item: AppMenuItem,
): item is Extract<AppMenuItem, { targetScreen: string }> {
  return "targetScreen" in item;
}

function resolveMenuItemKey(item: AppMenuItem): string {
  return isNavigationMenuItem(item) ? item.targetScreen : item.action;
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
  edgeHitArea: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: MenuUi.drawerSwipeEdgeWidth,
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.surface,
    paddingHorizontal: AppLayout.screenPadding * 2,
    gap: MenuUi.drawerGap,
    borderLeftWidth: 1,
    borderLeftColor: AppColors.border,
  },
  sections: {
    gap: MenuUi.drawerGap,
    paddingTop: MenuUi.titlePaddingTop,
  },
  section: {
    gap: MenuUi.sectionGap,
  },
  firstSectionHeader: {
    alignItems: "stretch",
    justifyContent: "center",
  },
  sectionLabel: {
    color: AppColors.mutedStrongText,
    fontSize: MenuUi.sectionTitleFontSize,
    fontWeight: "700",
  },
  items: {
    gap: MenuUi.itemGap,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: MenuUi.itemIconGap,
    paddingVertical: MenuUi.itemPaddingVertical,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLabel: {
    flex: 1,
    minWidth: 0,
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  itemPlusLabel: {
    ...BrandPlusTextStyle,
  },
});
