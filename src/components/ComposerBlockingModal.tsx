import { useLayoutEffect } from "react";
import { Keyboard, Modal, type ModalProps } from "react-native";

// Modal inputs own the keyboard; the background composer stays at rest.
export function ComposerBlockingModal(props: ModalProps) {
  useLayoutEffect(() => {
    if (props.visible === false) return;
    Keyboard.dismiss();
  }, [props.visible]);
  return <Modal {...props} />;
}
