import { Feather } from "./AppIcons";
import { MenuView } from "@react-native-menu/menu";
import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

import { AppColors } from "../constants/colors";
import { MenuCopy, MenuUi } from "../constants/menu";
import type { AppMenuAction, AppMenuNavigationItem, AppMenuSection } from "../lib/menuItems";
import { buildNativeAppMenuActions, getAppMenuItemId } from "../lib/nativeAppMenu";

type AppFloatingMenuButtonProps = {
  inline?: boolean;
  sections: AppMenuSection[];
  onOpen: () => void;
  onClose: () => void;
  onSelectAction: (action: AppMenuAction) => void;
  onSelectItem: (screen: AppMenuNavigationItem["targetScreen"]) => void;
};

export function AppFloatingMenuButton({ inline = false, sections, onOpen, onClose, onSelectAction, onSelectItem }: AppFloatingMenuButtonProps) {
  const actions = useMemo(() => buildNativeAppMenuActions(sections), [sections]);
  return (
    <MenuView
      actions={actions}
      onOpenMenu={onOpen}
      onCloseMenu={onClose}
      onPressAction={({ nativeEvent }) => {
        const item = sections.flatMap((section) => section.items)
          .find((candidate) => getAppMenuItemId(candidate) === nativeEvent.event);
        if (!item) return;
        onClose();
        if ("targetScreen" in item) onSelectItem(item.targetScreen);
        else onSelectAction(item.action);
      }}
      shouldOpenOnLongPress={false}
      isAnchoredToRight
      style={inline ? undefined : styles.anchor}
    >
      <Pressable
        accessibilityLabel={MenuCopy.openAccessibilityLabel}
        accessibilityRole="button"
        hitSlop={MenuUi.floatingButtonHitSlop}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.pressedButton : null,
        ]}
      >
        <Feather
          color={AppColors.mutedText}
          name="menu"
          size={MenuUi.floatingButtonIconSize}
        />
      </Pressable>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    top: MenuUi.floatingButtonVerticalInset,
    right: MenuUi.floatingButtonInset,
    zIndex: MenuUi.floatingButtonZIndex,
  },
  button: {
    width: MenuUi.floatingButtonSize,
    height: MenuUi.floatingButtonSize,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedButton: {
    opacity: MenuUi.floatingButtonPressedOpacity,
  },
});
