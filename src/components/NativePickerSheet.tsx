import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppLayout } from "../constants/layout";
import { AppColors } from "../constants/colors";
import { CardTitleTextStyle } from "../constants/uiStyles";
import { ModalCloseButton } from "./ModalCloseButton";
import { KeyboardAwareScrollView } from "./KeyboardAwareScrollView";
import { NativeSelectionSheet, type SheetHeaderAction } from "./NativeSelectionSheet";

export function NativePickerSheet({ children, isOpen, onClose, onShow, title, scrollEnabled = true, dismissible = true, inline = false, showHeader = true, header, action }: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onShow?: () => void;
  title: string;
  scrollEnabled?: boolean;
  dismissible?: boolean;
  inline?: boolean;
  showHeader?: boolean;
  header?: ReactNode;
  action?: SheetHeaderAction;
}) {
  if (inline) return !isOpen ? null : <View style={[styles.inlinePanel, !showHeader && styles.embeddedPanel]}>
    {showHeader ? <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <ModalCloseButton onPress={onClose} />
    </View> : null}
    {children}
  </View>;
  return (
    <NativeSelectionSheet isOpen={isOpen} dismissible={dismissible} onClose={onClose} onShow={onShow} title={title} header={header} action={action}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        extraScrollHeight={AppLayout.cardGap}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>
    </NativeSelectionSheet>
  );
}

const styles = StyleSheet.create({
  embeddedPanel: { backgroundColor: AppColors.transparent, borderRadius: 0, padding: AppLayout.compactGap },
  inlinePanel: { backgroundColor: AppColors.surface, borderRadius: AppLayout.groupRadius,
    padding: AppLayout.cardContentPadding, gap: AppLayout.cardGap },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: AppLayout.cardGap },
  title: { ...CardTitleTextStyle, flex: 1 },
  content: { padding: AppLayout.cardContentPadding, gap: AppLayout.cardGap },
});
