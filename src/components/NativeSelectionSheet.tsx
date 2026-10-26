import { useEffect, useRef, type ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RootSiblingParent } from "react-native-root-siblings";
import { AppColors } from "../constants/colors";
import { ComposerBlockingModal } from "./ComposerBlockingModal";
import { EntryComposerHeader } from "./entryComposer/EntryComposerHeader";

export type SheetHeaderAction = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };

export function NativeSelectionSheet({ children, isOpen, onClose, onShow, onDismiss, title, dismissible = true, header, action }: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
  title: string;
  dismissible?: boolean;
  header?: ReactNode;
  action?: SheetHeaderAction;
}) {
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    const closed = wasOpen.current && !isOpen;
    wasOpen.current = isOpen;
    // RN only exposes the native dismissal completion on iOS.
    if (Platform.OS !== "ios" && closed) onDismiss?.();
  }, [isOpen, onDismiss]);
  const canDismiss = isOpen && dismissible && !action?.loading;
  return (
    <ComposerBlockingModal
      visible={isOpen}
      onShow={onShow}
      onDismiss={onDismiss}
      animationType="slide"
      presentationStyle="formSheet"
      // iOS forwards swipe attempts to onRequestClose; let JS own the dismissal
      // so UIKit dismissal cannot race the modal's unmount.
      allowSwipeDismissal={false}
      onRequestClose={() => { if (canDismiss) onClose(); }}
    >
      <RootSiblingParent inactive={!isOpen}>
        <SafeAreaProvider>
          <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.sheet}>
            {header ?? <EntryComposerHeader title={title} saving={!canDismiss}
              onClose={() => { if (canDismiss) onClose(); }}
              actionLabel={action?.label} actionDisabled={action?.disabled}
              onAction={action ? () => { if (canDismiss && !action.disabled) action.onPress(); } : undefined} />}
            {children}
          </SafeAreaView>
        </SafeAreaProvider>
      </RootSiblingParent>
    </ComposerBlockingModal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: AppColors.surface },
});
