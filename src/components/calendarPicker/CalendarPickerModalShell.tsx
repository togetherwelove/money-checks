import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarPickerCopy } from "../../constants/calendarPicker";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";

type CalendarPickerModalShellProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function CalendarPickerModalShell({
  children,
  isOpen,
  onClose,
  title,
}: CalendarPickerModalShellProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.sheetContent}
            extraScrollHeight={AppLayout.screenPadding * 6}
            fillAvailableHeight={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose}>
                <Text style={styles.closeText}>{CalendarPickerCopy.closeAction}</Text>
              </Pressable>
            </View>
            {children}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: AppColors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    marginHorizontal: AppLayout.screenPadding * 2,
    borderRadius: AppLayout.cardRadius,
    overflow: "hidden",
    backgroundColor: AppColors.surface,
  },
  sheetContent: {
    padding: AppLayout.screenPadding * 2,
    gap: AppLayout.cardGap,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  closeText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
});
