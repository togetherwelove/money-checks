import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { FooterActionPopoverUi } from "../constants/menu";
import { OneLineTextFitProps } from "../constants/textLayout";

export type FooterActionPopoverAction = {
  label: string;
  onPress: () => void;
};

type FooterActionPopoverProps = {
  actions: FooterActionPopoverAction[];
  bottomOffset: number;
  onDismiss: () => void;
  visible: boolean;
};

export function FooterActionPopover({
  actions,
  bottomOffset,
  onDismiss,
  visible,
}: FooterActionPopoverProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable accessible={false} onPress={onDismiss} style={StyleSheet.absoluteFill} />
        <View pointerEvents="box-none" style={[styles.positioner, { bottom: bottomOffset }]}>
          <View style={styles.menu}>
            {actions.map((action, index) => {
              const isLastAction = index === actions.length - 1;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={action.label}
                  onPress={action.onPress}
                  style={[styles.action, isLastAction ? null : styles.actionDivider]}
                >
                  <Text {...OneLineTextFitProps} style={styles.actionText}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  positioner: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  menu: {
    maxWidth: FooterActionPopoverUi.maxWidth,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: FooterActionPopoverUi.borderRadius,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.calendarShadow,
    shadowOpacity: FooterActionPopoverUi.shadowOpacity,
    shadowRadius: FooterActionPopoverUi.shadowRadius,
    shadowOffset: {
      width: 0,
      height: FooterActionPopoverUi.shadowOffsetY,
    },
    elevation: 5,
  },
  action: {
    minHeight: FooterActionPopoverUi.actionMinHeight,
    justifyContent: "center",
    paddingHorizontal: FooterActionPopoverUi.actionPaddingHorizontal,
    paddingVertical: FooterActionPopoverUi.actionPaddingVertical,
  },
  actionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  actionText: {
    color: AppColors.text,
    fontSize: FooterActionPopoverUi.textFontSize,
  },
});
