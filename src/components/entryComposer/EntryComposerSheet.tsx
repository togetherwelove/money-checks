import type { ReactNode } from "react";
import { EntryComposerCopy } from "../../constants/entryComposer";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import { NativeSelectionSheet } from "../NativeSelectionSheet";

type Props = {
  children: ReactNode;
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
  header?: ReactNode;
};

// EntryComposer owns the draft outside the modal's mount/unmount lifecycle.
export function EntryComposerSheet({ children, visible, saving, onClose, onShow, onDismiss, header }: Props) {
  return (
    <NativeSelectionSheet isOpen={visible} dismissible={!saving}
      onClose={onClose} onShow={onShow} onDismiss={onDismiss} title={EntryComposerCopy.sheetTitle} header={header}>
      <KeyboardAwareScrollView>{children}</KeyboardAwareScrollView>
    </NativeSelectionSheet>
  );
}
